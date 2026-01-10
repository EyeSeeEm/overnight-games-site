// High Tea Clone - Phaser 3 Version
const COLORS = {
    sea: 0x4a8a8a,
    seaLight: 0x5a9a9a,
    land: 0xc4a060,
    landDark: 0xa08040,
    panelBg: 0xf4e8d0,
    panelBorder: 0xa08050,
    text: 0x3a2a1a,
    silver: 0x708090,
    opium: 0x804020,
    tea: 0x408040,
    highlight: 0xffd700,
    danger: 0xc04040,
    button: 0xd4c0a0,
    buttonHover: 0xe8d8b8,
    offer: 0xffffff,
    ship: 0x8b4513
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Ship texture
        const shipGfx = this.make.graphics({ add: false });
        shipGfx.fillStyle(COLORS.ship);
        shipGfx.beginPath();
        shipGfx.moveTo(20, 10);
        shipGfx.lineTo(5, 5);
        shipGfx.lineTo(5, 15);
        shipGfx.closePath();
        shipGfx.fillPath();
        shipGfx.fillStyle(0xffffff);
        shipGfx.fillRect(8, 2, 2, 16);
        shipGfx.beginPath();
        shipGfx.moveTo(9, 4);
        shipGfx.lineTo(18, 10);
        shipGfx.lineTo(9, 16);
        shipGfx.fillPath();
        shipGfx.generateTexture('ship', 24, 20);

        // Port marker
        const portGfx = this.make.graphics({ add: false });
        portGfx.fillStyle(0xffffff);
        portGfx.fillCircle(8, 8, 8);
        portGfx.lineStyle(2, COLORS.panelBorder);
        portGfx.strokeCircle(8, 8, 8);
        portGfx.generateTexture('port', 16, 16);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.gameState = {
            year: 1830,
            silver: 500,
            opium: 0,
            tea: 0,
            ships: 1,
            maxShips: 6,
            mood: 100,
            quota: 60,
            teaShipped: 0,
            quotaTimer: 120,
            gameOver: false
        };

        this.opiumPrice = 25;
        this.teaPrice = 15;
        this.offers = [];
        this.activeShips = [];
    }

    create() {
        // Draw map background
        this.drawMap();

        // Create ports
        this.ports = [
            { name: 'Lintin', x: 650, y: 150, risk: 1, basePrice: 1.0 },
            { name: 'Whampoa', x: 700, y: 280, risk: 2, basePrice: 1.1 },
            { name: 'Canton', x: 580, y: 220, risk: 3, basePrice: 1.25 },
            { name: 'Macao', x: 550, y: 450, risk: 2, basePrice: 1.15 },
            { name: 'Bocca Tigris', x: 750, y: 380, risk: 4, basePrice: 1.4 }
        ];

        this.ports.forEach(port => {
            const marker = this.add.image(port.x, port.y, 'port').setInteractive();
            const label = this.add.text(port.x, port.y + 18, port.name, {
                fontSize: '11px',
                fontFamily: 'Georgia',
                color: '#3a2a1a'
            }).setOrigin(0.5);
            port.marker = marker;
            port.label = label;
        });

        // Create ship sprites group
        this.shipSprites = this.add.group();

        // Create offer containers group
        this.offerContainers = this.add.group();

        // Create UI
        this.createUI();

        // Spawn initial offer
        this.time.delayedCall(1000, () => this.spawnOffer());

        // Update prices
        this.updatePrices();

        // Expose for testing
        window.game = this.gameState;
    }

    drawMap() {
        // Sea
        this.add.rectangle(550, 300, 700, 600, COLORS.sea);

        // Sea waves
        for (let y = 0; y < 600; y += 30) {
            for (let x = 250; x < 900; x += 50) {
                this.add.circle(x + Math.sin(y * 0.1) * 10, y, 3, COLORS.seaLight, 0.5);
            }
        }

        // Land masses
        const landGfx = this.add.graphics();
        landGfx.fillStyle(COLORS.land);

        // Top land
        landGfx.beginPath();
        landGfx.moveTo(400, 0);
        landGfx.lineTo(500, 80);
        landGfx.lineTo(600, 100);
        landGfx.lineTo(700, 80);
        landGfx.lineTo(800, 120);
        landGfx.lineTo(900, 100);
        landGfx.lineTo(900, 0);
        landGfx.closePath();
        landGfx.fillPath();

        // Middle peninsula
        landGfx.beginPath();
        landGfx.moveTo(450, 150);
        landGfx.lineTo(500, 200);
        landGfx.lineTo(480, 280);
        landGfx.lineTo(520, 350);
        landGfx.lineTo(500, 400);
        landGfx.lineTo(400, 380);
        landGfx.lineTo(380, 300);
        landGfx.lineTo(400, 220);
        landGfx.closePath();
        landGfx.fillPath();

        // Macao peninsula
        landGfx.beginPath();
        landGfx.moveTo(450, 400);
        landGfx.lineTo(500, 450);
        landGfx.lineTo(520, 520);
        landGfx.lineTo(580, 600);
        landGfx.lineTo(400, 600);
        landGfx.lineTo(420, 480);
        landGfx.closePath();
        landGfx.fillPath();

        // Right land
        landGfx.beginPath();
        landGfx.moveTo(750, 200);
        landGfx.lineTo(850, 250);
        landGfx.lineTo(900, 300);
        landGfx.lineTo(900, 200);
        landGfx.lineTo(820, 150);
        landGfx.closePath();
        landGfx.fillPath();
    }

    createUI() {
        // Left panel
        this.add.rectangle(105, 300, 210, 600, COLORS.panelBg);
        this.add.rectangle(105, 300, 210, 600).setStrokeStyle(3, COLORS.panelBorder);

        // Title
        this.add.text(105, 25, 'INVENTORY', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        // Silver
        this.silverText = this.add.text(50, 65, '500', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#708090'
        });
        this.add.text(50, 87, 'SILVER COINS', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Opium
        this.opiumText = this.add.text(50, 120, '0', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#804020'
        });
        this.add.text(50, 142, 'OPIUM CHESTS', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Tea
        this.teaText = this.add.text(50, 175, '0', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#408040'
        });
        this.add.text(50, 197, 'TEA CHESTS', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Buy Opium
        this.add.text(105, 245, 'BUY OPIUM', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        this.opiumPriceText = this.add.text(105, 268, '25 silver/chest', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#804020'
        }).setOrigin(0.5);

        this.createButton(52, 295, '5', () => this.buyOpium(5));
        this.createButton(107, 295, '15', () => this.buyOpium(15));
        this.createButton(162, 295, '30', () => this.buyOpium(30));

        // Buy Tea
        this.add.text(105, 365, 'BUY TEA', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        this.teaPriceText = this.add.text(105, 388, '15 silver/chest', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#408040'
        }).setOrigin(0.5);

        this.createButton(52, 415, '5', () => this.buyTea(5));
        this.createButton(107, 415, '15', () => this.buyTea(15));
        this.createButton(162, 415, '30', () => this.buyTea(30));

        // Ships
        this.add.text(30, 490, 'SHIPS', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        this.shipIcons = [];
        for (let i = 0; i < 6; i++) {
            const icon = this.add.text(30 + i * 28, 520, '⛵', {
                fontSize: '20px'
            });
            this.shipIcons.push(icon);
        }

        // Top bar
        this.add.rectangle(550, 25, 700, 50, 0x000000, 0.5);

        // Year
        this.yearText = this.add.text(230, 25, '1830', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Timeline
        this.timelineDots = [];
        for (let y = 1830; y <= 1839; y++) {
            const x = 350 + (y - 1830) * 30;
            const dot = this.add.circle(x, 25, y === 1830 ? 8 : 5, 0xffffff);
            this.timelineDots.push({ dot, year: y });
        }

        // Mood label
        this.add.text(880, 12, "BRITAIN'S MOOD", {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Mood bar
        this.moodBarBg = this.add.rectangle(805, 32, 150, 15, 0x333333);
        this.moodBarFill = this.add.rectangle(730, 32, 150, 15, COLORS.tea);
        this.moodBarFill.setOrigin(0, 0.5);

        // Quota panel
        this.add.rectangle(400, 560, 300, 70, COLORS.panelBg);
        this.add.rectangle(400, 560, 300, 70).setStrokeStyle(2, COLORS.panelBorder);

        this.add.text(270, 535, '⛵', { fontSize: '24px' });

        this.quotaText = this.add.text(300, 535, 'TEA ORDER: 60 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        this.quotaTeaText = this.add.text(300, 555, 'Your tea: 0 chests', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#3a2a1a'
        });

        this.timerText = this.add.text(480, 555, '2:00', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        // Message text
        this.messageText = this.add.text(450, 270, '', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setVisible(false);

        // Game over overlay
        this.gameOverOverlay = this.add.container(450, 300).setVisible(false).setDepth(100);
        this.gameOverOverlay.add(this.add.rectangle(0, 0, 900, 600, 0x000000, 0.8));
        this.gameOverText = this.add.text(0, -30, '', {
            fontSize: '36px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.gameOverText);
        this.gameOverStats = this.add.text(0, 40, '', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.gameOverStats);
        this.restartText = this.add.text(0, 100, 'Click to play again', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        this.gameOverOverlay.add(this.restartText);
        this.restartText.on('pointerdown', () => this.restartGame());
    }

    createButton(x, y, text, callback) {
        const btn = this.add.rectangle(x, y, 45, 30, COLORS.button)
            .setInteractive()
            .on('pointerover', () => btn.setFillStyle(COLORS.buttonHover))
            .on('pointerout', () => btn.setFillStyle(COLORS.button))
            .on('pointerdown', callback);

        btn.setStrokeStyle(1, COLORS.panelBorder);

        this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
    }

    updatePrices() {
        const yearMod = 1 + (this.gameState.year - 1830) * 0.08;
        const randomNoise = 0.9 + Math.random() * 0.2;

        this.opiumPrice = Math.round(20 * yearMod * randomNoise);
        if (this.gameState.year >= 1833) this.opiumPrice = Math.round(this.opiumPrice * 1.5);

        this.teaPrice = Math.round(12 * yearMod * randomNoise);

        this.opiumPriceText.setText(`${this.opiumPrice} silver/chest`);
        this.teaPriceText.setText(`${this.teaPrice} silver/chest`);
    }

    spawnOffer() {
        if (this.offers.length >= 3) return;

        const availablePorts = this.ports.filter(p => !this.offers.find(o => o.port === p));
        if (availablePorts.length === 0) return;

        const port = Phaser.Utils.Array.GetRandom(availablePorts);
        const quantity = 10 + Math.floor(Math.random() * 30) + (this.gameState.year - 1830) * 5;
        const pricePerChest = Math.round(40 * port.basePrice * (0.9 + Math.random() * 0.3));

        const offer = {
            port,
            quantity,
            price: pricePerChest,
            timer: 12 + Math.random() * 8
        };

        // Create offer UI
        const container = this.add.container(port.x, port.y - 55);

        const bg = this.add.rectangle(0, 0, 110, 65, COLORS.offer, 1);
        bg.setStrokeStyle(2, COLORS.panelBorder);
        container.add(bg);

        // Arrow
        const arrow = this.add.triangle(0, 35, -8, 0, 8, 0, 0, 10, COLORS.offer);
        container.add(arrow);

        const quantityText = this.add.text(0, -18, `${quantity} CHESTS`, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        container.add(quantityText);

        const priceText = this.add.text(0, 2, `${pricePerChest} silver/chest`, {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        container.add(priceText);

        // Risk stars
        let starsStr = '';
        for (let i = 0; i < 5; i++) {
            starsStr += i < port.risk ? '★' : '☆';
        }
        const stars = this.add.text(0, 20, starsStr, {
            fontSize: '10px',
            color: '#ffd700'
        }).setOrigin(0.5);
        container.add(stars);

        // Timer bar
        const timerBar = this.add.rectangle(-40, -28, 80, 4, COLORS.tea);
        timerBar.setOrigin(0, 0.5);
        container.add(timerBar);

        // Make clickable
        bg.setInteractive();
        bg.on('pointerdown', () => this.acceptOffer(offer));

        offer.container = container;
        offer.timerBar = timerBar;
        this.offers.push(offer);
    }

    acceptOffer(offer) {
        const availableShips = this.gameState.ships - this.activeShips.length;
        if (availableShips <= 0) {
            this.showMessage('No ships available!');
            return;
        }
        if (this.gameState.opium < offer.quantity) {
            this.showMessage('Not enough opium!');
            return;
        }

        this.gameState.opium -= offer.quantity;

        // Create ship sprite
        const ship = this.add.image(300, 550, 'ship');
        this.activeShips.push({
            sprite: ship,
            targetX: offer.port.x,
            targetY: offer.port.y,
            returning: false,
            cargo: offer.quantity,
            value: offer.quantity * offer.price,
            risk: offer.port.risk,
            port: offer.port
        });

        // Remove offer
        offer.container.destroy();
        this.offers = this.offers.filter(o => o !== offer);
        this.showMessage(`Ship sent to ${offer.port.name}`);
    }

    buyOpium(amount) {
        const cost = amount * this.opiumPrice;
        if (this.gameState.silver >= cost) {
            this.gameState.silver -= cost;
            this.gameState.opium += amount;
            this.showMessage(`Bought ${amount} opium`);
        } else {
            this.showMessage('Not enough silver!');
        }
    }

    buyTea(amount) {
        const cost = amount * this.teaPrice;
        if (this.gameState.silver >= cost) {
            this.gameState.silver -= cost;
            this.gameState.tea += amount;
            this.showMessage(`Bought ${amount} tea`);
        } else {
            this.showMessage('Not enough silver!');
        }
    }

    showMessage(msg) {
        this.messageText.setText(msg).setVisible(true);
        this.time.delayedCall(2500, () => this.messageText.setVisible(false));
    }

    update(time, delta) {
        if (this.gameState.gameOver) return;

        const dt = delta / 1000;

        // Update offers
        for (let i = this.offers.length - 1; i >= 0; i--) {
            const offer = this.offers[i];
            offer.timer -= dt;
            offer.timerBar.width = Math.max(0, (offer.timer / 20) * 80);
            offer.timerBar.setFillStyle(offer.timer < 5 ? COLORS.danger : COLORS.tea);

            // Bob animation
            offer.container.y = offer.port.y - 55 + Math.sin(time * 0.003) * 3;

            if (offer.timer <= 0) {
                offer.container.destroy();
                this.offers.splice(i, 1);
            }
        }

        // Spawn new offers
        if (Math.random() < dt * 0.25) {
            this.spawnOffer();
        }

        // Update ships
        for (let i = this.activeShips.length - 1; i >= 0; i--) {
            const ship = this.activeShips[i];
            const tx = ship.returning ? 300 : ship.targetX;
            const ty = ship.returning ? 550 : ship.targetY;

            const dx = tx - ship.sprite.x;
            const dy = ty - ship.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 80;

            if (dist > 5) {
                ship.sprite.x += (dx / dist) * speed * dt;
                ship.sprite.y += (dy / dist) * speed * dt;
                ship.sprite.rotation = Math.atan2(dy, dx);
            } else if (!ship.returning) {
                // Risk check
                const riskChance = ship.risk * 0.1;
                if (Math.random() < riskChance) {
                    if (Math.random() < 0.3) {
                        this.showMessage(`Ship captured at ${ship.port.name}!`);
                        ship.sprite.destroy();
                        this.activeShips.splice(i, 1);
                        this.gameState.ships--;
                        if (this.gameState.ships <= 0) {
                            this.endGame('All ships lost! Game Over.');
                        }
                        continue;
                    } else {
                        const fine = Math.floor(ship.value * 0.3);
                        ship.value -= fine;
                        this.showMessage(`Fined ${fine} silver`);
                    }
                }
                ship.returning = true;
            } else {
                this.gameState.silver += ship.value;
                this.showMessage(`+${ship.value} silver`);
                ship.sprite.destroy();
                this.activeShips.splice(i, 1);
            }
        }

        // Update quota timer
        this.gameState.quotaTimer -= dt;
        if (this.gameState.quotaTimer <= 0) {
            this.processQuota();
        }

        // Update mood
        this.gameState.mood -= dt * 0.5;
        if (this.gameState.mood <= 0) {
            this.endGame("Britain's patience has run out.");
        }

        // Update UI
        this.updateUI();
    }

    processQuota() {
        const shipped = Math.min(this.gameState.tea, this.gameState.quota);
        this.gameState.tea -= shipped;
        this.gameState.teaShipped += shipped;

        if (shipped >= this.gameState.quota) {
            this.gameState.mood = Math.min(100, this.gameState.mood + 15);
            this.gameState.ships = Math.min(this.gameState.maxShips, this.gameState.ships + 1);
            this.showMessage('Quota met! +1 ship');
        } else {
            const shortfall = this.gameState.quota - shipped;
            this.gameState.mood -= 20 + Math.floor(shortfall / 10) * 5;
            this.showMessage(`Quota missed by ${shortfall}!`);
        }

        this.advanceYear();
    }

    advanceYear() {
        this.gameState.year++;
        if (this.gameState.year > 1839) {
            this.endGame(`Victory! Shipped ${this.gameState.teaShipped} tea.`);
            return;
        }

        const quotas = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];
        this.gameState.quota = quotas[this.gameState.year - 1830] || 660;
        this.gameState.quotaTimer = 120;

        this.updatePrices();
        this.showMessage(`Year ${this.gameState.year}. Quota: ${this.gameState.quota}`);
    }

    updateUI() {
        this.silverText.setText(this.gameState.silver.toString());
        this.opiumText.setText(this.gameState.opium.toString());
        this.teaText.setText(this.gameState.tea.toString());

        this.yearText.setText(this.gameState.year.toString());

        // Timeline
        this.timelineDots.forEach(({ dot, year }) => {
            dot.setFillStyle(year <= this.gameState.year ? 0xffffff : 0x555555);
            dot.setRadius(year === this.gameState.year ? 8 : 5);
        });

        // Mood
        this.moodBarFill.width = 150 * (this.gameState.mood / 100);
        this.moodBarFill.setFillStyle(
            this.gameState.mood > 50 ? COLORS.tea :
            this.gameState.mood > 25 ? 0xffaa00 : COLORS.danger
        );

        // Ships
        const availableShips = this.gameState.ships - this.activeShips.length;
        this.shipIcons.forEach((icon, i) => {
            icon.setVisible(i < this.gameState.ships);
            icon.setAlpha(i < availableShips ? 1 : 0.3);
        });

        // Quota
        this.quotaText.setText(`TEA ORDER: ${this.gameState.quota} chests`);
        this.quotaTeaText.setText(`Your tea: ${this.gameState.tea} chests`);

        const minutes = Math.floor(this.gameState.quotaTimer / 60);
        const seconds = Math.floor(this.gameState.quotaTimer % 60);
        this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        this.timerText.setColor(this.gameState.quotaTimer < 30 ? '#c04040' : '#3a2a1a');
    }

    endGame(message) {
        this.gameState.gameOver = true;
        this.gameOverText.setText(message);
        this.gameOverStats.setText(
            `Tea Shipped: ${this.gameState.teaShipped} chests\nSilver: ${this.gameState.silver}`
        );
        this.gameOverOverlay.setVisible(true);
    }

    restartGame() {
        this.scene.restart();
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 900,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2a3a3a',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
