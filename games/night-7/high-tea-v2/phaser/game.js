// High Tea - Historical Trading Strategy Game
const GAME_WIDTH = 900;
const GAME_HEIGHT = 650;

// Port definitions
const PORTS = [
    { name: 'Lintin Island', x: 480, y: 180, baseRisk: 0.05, priceBonus: 0.9 },
    { name: 'Whampoa', x: 620, y: 280, baseRisk: 0.08, priceBonus: 1.0 },
    { name: 'Canton', x: 550, y: 350, baseRisk: 0.15, priceBonus: 1.2 },
    { name: 'Macao', x: 380, y: 380, baseRisk: 0.10, priceBonus: 1.1 },
    { name: 'Bocca Tigris', x: 700, y: 200, baseRisk: 0.20, priceBonus: 1.4 }
];

// Year quotas
const QUOTAS = {
    1830: 60, 1831: 90, 1832: 120, 1833: 180, 1834: 250,
    1835: 320, 1836: 400, 1837: 500, 1838: 580, 1839: 660
};

// Historical events
const EVENTS = {
    1832: { title: 'Orders Drying Up', text: 'Chinese merchants are becoming cautious. Offers are less frequent.' },
    1833: { title: 'Dealing Houses Merge', text: 'Bengal trading houses consolidate. Opium prices soar!' },
    1836: { title: 'Commissioner Lin Appointed', text: 'Emperor appoints Lin Zexu to end opium trade. Risk increases!' },
    1839: { title: 'Lin Demands Surrender', text: 'Lin Zexu demands all foreign opium be surrendered. War is imminent!' }
};

// ========== BOOT SCENE ==========
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.createTextures();
    }

    createTextures() {
        let g = this.make.graphics({ add: false });

        // Ship
        g.fillStyle(0x8b4513);
        g.fillRect(8, 16, 16, 24);
        g.fillStyle(0xf5deb3);
        g.fillTriangle(16, 4, 4, 20, 28, 20);
        g.fillStyle(0x654321);
        g.fillRect(14, 4, 4, 16);
        g.generateTexture('ship', 32, 40);

        // Port marker
        g.clear();
        g.fillStyle(0x8b7355);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xf5deb3);
        g.fillCircle(16, 16, 10);
        g.generateTexture('port', 32, 32);

        // Opium crate
        g.clear();
        g.fillStyle(0x4a3728);
        g.fillRect(0, 0, 20, 20);
        g.fillStyle(0x6b4423);
        g.fillRect(2, 2, 16, 6);
        g.generateTexture('opium', 20, 20);

        // Tea crate
        g.clear();
        g.fillStyle(0x228b22);
        g.fillRect(0, 0, 20, 20);
        g.fillStyle(0x32cd32);
        g.fillRect(2, 2, 16, 6);
        g.generateTexture('tea', 20, 20);

        // Silver coin
        g.clear();
        g.fillStyle(0xc0c0c0);
        g.fillCircle(10, 10, 9);
        g.fillStyle(0xe8e8e8);
        g.fillCircle(10, 10, 5);
        g.generateTexture('silver', 20, 20);

        // Map background
        g.clear();
        g.fillStyle(0x3a6ea5);
        g.fillRect(0, 0, 400, 350);
        // Land masses
        g.fillStyle(0x8b7355);
        g.fillRect(280, 0, 120, 80);
        g.fillRect(320, 80, 80, 60);
        g.fillRect(0, 200, 120, 150);
        g.fillRect(100, 280, 100, 70);
        g.fillRect(300, 300, 100, 50);
        g.fillStyle(0x6b5344);
        g.fillRect(350, 150, 50, 100);
        g.generateTexture('map', 400, 350);

        // Offer bubble
        g.clear();
        g.fillStyle(0xf5deb3);
        g.fillRoundedRect(0, 0, 100, 60, 8);
        g.fillStyle(0x8b7355);
        g.lineStyle(2, 0x654321);
        g.strokeRoundedRect(0, 0, 100, 60, 8);
        g.generateTexture('bubble', 100, 60);

        // Heart (mood icon)
        g.clear();
        g.fillStyle(0xcc4444);
        g.fillCircle(6, 6, 5);
        g.fillCircle(14, 6, 5);
        g.fillTriangle(2, 8, 10, 18, 18, 8);
        g.generateTexture('heart', 20, 20);

        // Clipper ship (larger)
        g.clear();
        g.fillStyle(0x4a3728);
        g.fillRect(10, 30, 40, 20);
        g.fillStyle(0xf5deb3);
        g.fillTriangle(30, 0, 10, 35, 50, 35);
        g.fillTriangle(30, 5, 15, 30, 45, 30);
        g.fillStyle(0x654321);
        g.fillRect(28, 0, 4, 30);
        g.generateTexture('clipper', 60, 50);

        // Panel background
        g.clear();
        g.fillStyle(0x2a1f15);
        g.fillRoundedRect(0, 0, 150, 200, 8);
        g.lineStyle(2, 0x8b7355);
        g.strokeRoundedRect(0, 0, 150, 200, 8);
        g.generateTexture('panel', 150, 200);

        // Button
        g.clear();
        g.fillStyle(0x654321);
        g.fillRoundedRect(0, 0, 40, 28, 4);
        g.fillStyle(0x8b7355);
        g.fillRoundedRect(2, 2, 36, 24, 3);
        g.generateTexture('button', 40, 28);

        // Speed button
        g.clear();
        g.fillStyle(0x444444);
        g.fillRoundedRect(0, 0, 50, 30, 4);
        g.generateTexture('speedBtn', 50, 30);

        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// ========== MENU SCENE ==========
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1510);

        this.add.text(GAME_WIDTH / 2, 80, 'HIGH TEA', {
            fontSize: '56px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            stroke: '#1a1510',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 140, 'The Opium Trade, 1830-1839', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            color: '#8b7355'
        }).setOrigin(0.5);

        // Historical context
        const context = [
            'Britain is addicted to tea, but China only accepts silver.',
            'Your solution? Sell opium from Bengal to Chinese ports.',
            'Use the silver to buy tea and ship it back to Britain.',
            '',
            'Balance profit against risk.',
            'Meet Britain\'s growing demands.',
            'Survive until 1839.'
        ];

        context.forEach((text, i) => {
            this.add.text(GAME_WIDTH / 2, 200 + i * 28, text, {
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                color: '#c4a777'
            }).setOrigin(0.5);
        });

        // Controls
        this.add.text(GAME_WIDTH / 2, 450, 'Click port offers to trade opium for silver', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 475, 'Buy tea with silver, ship to Britain to meet quotas', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        const startBtn = this.add.text(GAME_WIDTH / 2, 550, '[ BEGIN TRADING ]', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#f4cf57'));
        startBtn.on('pointerout', () => startBtn.setColor('#d4af37'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ========== GAME SCENE ==========
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        // Game state
        this.year = 1830;
        this.month = 1;
        this.silver = 500;
        this.opium = 0;
        this.tea = 0;
        this.ships = 1;
        this.availableShips = 1;
        this.mood = 80;
        this.bribeCard = 0;
        this.gameSpeed = 1;

        // Statistics
        this.totalOpiumSold = 0;
        this.totalTeaShipped = 0;
        this.totalSilverEarned = 0;
        this.shipsLost = 0;
        this.finesPaid = 0;

        // Port risk tracking
        this.portRisks = PORTS.map(p => p.baseRisk);

        // Prices
        this.updatePrices();

        // Active offers and ships
        this.activeOffers = [];
        this.activeTrips = [];

        // Clipper timer
        this.clipperTime = 60;
        this.clipperMax = 60;

        // Tutorial
        this.tutorialStep = 0;
        this.tutorialActive = true;

        // Create UI
        this.createUI();

        // Game timers
        this.time.addEvent({
            delay: 1000,
            callback: this.gameTick,
            callbackScope: this,
            loop: true
        });

        // Offer spawner
        this.time.addEvent({
            delay: 4000,
            callback: this.spawnOffer,
            callbackScope: this,
            loop: true
        });

        // Show tutorial
        this.showTutorial();
    }

    createUI() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1510);

        // Top bar
        this.add.rectangle(GAME_WIDTH / 2, 25, GAME_WIDTH, 50, 0x0d0a08);

        this.yearText = this.add.text(20, 15, '', {
            fontSize: '22px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        });

        this.moodText = this.add.text(200, 15, '', {
            fontSize: '18px',
            color: '#cc8844'
        });

        this.silverText = this.add.text(450, 15, '', {
            fontSize: '20px',
            color: '#c0c0c0'
        });

        // Speed controls
        this.add.text(GAME_WIDTH - 180, 15, 'Speed:', {
            fontSize: '14px',
            color: '#888888'
        });

        const speeds = [1, 2, 3];
        speeds.forEach((speed, i) => {
            const btn = this.add.text(GAME_WIDTH - 120 + i * 40, 15, `${speed}x`, {
                fontSize: '16px',
                color: speed === 1 ? '#ffcc00' : '#666666',
                backgroundColor: '#333333',
                padding: { x: 6, y: 3 }
            }).setInteractive();

            btn.on('pointerdown', () => {
                this.gameSpeed = speed;
                this.children.list.forEach(child => {
                    if (child.text && child.text.match(/\dx$/)) {
                        child.setColor(child.text === `${speed}x` ? '#ffcc00' : '#666666');
                    }
                });
            });
        });

        // Left panels
        // Opium panel
        this.add.image(85, 180, 'panel');
        this.add.text(85, 95, 'BUY OPIUM', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);

        this.opiumPriceText = this.add.text(85, 120, '', {
            fontSize: '16px',
            color: '#c4a777'
        }).setOrigin(0.5);

        // Opium buy buttons
        [5, 10, 15].forEach((amount, i) => {
            const btn = this.add.text(30 + i * 40, 150, `${amount}`, {
                fontSize: '16px',
                color: '#f5deb3',
                backgroundColor: '#4a3728',
                padding: { x: 8, y: 5 }
            }).setInteractive();

            btn.on('pointerdown', () => this.buyOpium(amount));
            btn.on('pointerover', () => btn.setBackgroundColor('#6b5344'));
            btn.on('pointerout', () => btn.setBackgroundColor('#4a3728'));
        });

        this.opiumStockText = this.add.text(85, 195, '', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // Tea panel
        this.add.image(85, 380, 'panel');
        this.add.text(85, 295, 'BUY TEA', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#228b22'
        }).setOrigin(0.5);

        this.teaPriceText = this.add.text(85, 320, '', {
            fontSize: '16px',
            color: '#7cfc00'
        }).setOrigin(0.5);

        [5, 10, 15].forEach((amount, i) => {
            const btn = this.add.text(30 + i * 40, 350, `${amount}`, {
                fontSize: '16px',
                color: '#f5deb3',
                backgroundColor: '#2e5a2e',
                padding: { x: 8, y: 5 }
            }).setInteractive();

            btn.on('pointerdown', () => this.buyTea(amount));
            btn.on('pointerover', () => btn.setBackgroundColor('#3a7a3a'));
            btn.on('pointerout', () => btn.setBackgroundColor('#2e5a2e'));
        });

        this.teaStockText = this.add.text(85, 395, '', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // Ships panel
        this.add.rectangle(85, 530, 140, 80, 0x2a1f15);
        this.add.text(85, 500, 'FLEET', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#8b7355'
        }).setOrigin(0.5);

        this.shipsText = this.add.text(85, 530, '', {
            fontSize: '18px',
            color: '#f5deb3'
        }).setOrigin(0.5);

        this.bribeText = this.add.text(85, 555, '', {
            fontSize: '12px',
            color: '#cc8844'
        }).setOrigin(0.5);

        // Map area
        this.add.image(500, 280, 'map');

        // Port markers
        this.portMarkers = [];
        this.portTexts = [];
        this.offerGroup = this.add.group();

        PORTS.forEach((port, i) => {
            const marker = this.add.image(port.x, port.y, 'port');
            marker.setInteractive();
            marker.setData('portIndex', i);
            this.portMarkers.push(marker);

            const text = this.add.text(port.x, port.y + 22, port.name, {
                fontSize: '11px',
                color: '#f5deb3'
            }).setOrigin(0.5);
            this.portTexts.push(text);
        });

        // Clipper/Quota panel (bottom)
        this.add.rectangle(500, 530, 350, 100, 0x2a1f15);

        this.add.text(500, 490, 'TEA CLIPPER', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);

        this.clipperTimerText = this.add.text(500, 515, '', {
            fontSize: '18px',
            color: '#f5deb3'
        }).setOrigin(0.5);

        this.quotaText = this.add.text(500, 545, '', {
            fontSize: '14px',
            color: '#c4a777'
        }).setOrigin(0.5);

        // Progress bar
        this.quotaBarBg = this.add.rectangle(500, 570, 300, 16, 0x333333);
        this.quotaBar = this.add.rectangle(352, 570, 0, 12, 0x228b22).setOrigin(0, 0.5);

        // News ticker
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 15, GAME_WIDTH, 30, 0x0d0a08);
        this.newsText = this.add.text(20, GAME_HEIGHT - 20, '', {
            fontSize: '13px',
            color: '#c4a777'
        });

        this.updateUI();
    }

    updateUI() {
        const floorNames = ['Keep of Lead', 'Gungeon Proper', 'The Forge'];

        this.yearText.setText(`Year: ${this.year}  Month: ${this.month}`);

        // Mood display
        const moodBars = Math.floor(this.mood / 10);
        const moodColor = this.mood > 60 ? '#44aa44' : this.mood > 30 ? '#ccaa44' : '#cc4444';
        this.moodText.setText(`Britain's Mood: ${'█'.repeat(moodBars)}${'░'.repeat(10 - moodBars)} ${this.mood}%`);
        this.moodText.setColor(moodColor);

        this.silverText.setText(`Silver: ${this.silver}`);

        this.opiumPriceText.setText(`Price: ${this.opiumPrice}/chest`);
        this.opiumStockText.setText(`Stock: ${this.opium} chests`);

        this.teaPriceText.setText(`Price: ${this.teaPrice}/chest`);
        this.teaStockText.setText(`Stock: ${this.tea} chests`);

        this.shipsText.setText(`Ships: ${this.availableShips}/${this.ships}`);
        this.bribeText.setText(`Bribe Cards: ${this.bribeCard}`);

        this.clipperTimerText.setText(`Arriving in: ${this.clipperTime}s`);
        const quota = QUOTAS[this.year];
        this.quotaText.setText(`Quota: ${this.tea}/${quota} chests`);

        // Update quota bar
        const progress = Math.min(1, this.tea / quota);
        this.quotaBar.setScale(progress * 296, 1);
    }

    updatePrices() {
        // Opium price based on year
        let baseOpium = 25;
        if (this.year >= 1833) baseOpium = 60;
        if (this.year >= 1835) baseOpium = 85;
        if (this.year >= 1837) baseOpium = 100;

        this.opiumPrice = Math.floor(baseOpium * (0.8 + Math.random() * 0.4));

        // Tea price based on year
        let baseTea = 18;
        if (this.year >= 1834) baseTea = 32;
        if (this.year >= 1837) baseTea = 55;

        this.teaPrice = Math.floor(baseTea * (0.8 + Math.random() * 0.4));
    }

    buyOpium(amount) {
        const cost = amount * this.opiumPrice;
        if (this.silver >= cost) {
            this.silver -= cost;
            this.opium += amount;
            this.showTradeAnimation(`-${cost} Silver`, this.silverText.x, this.silverText.y, '#cc4444');
            this.showTradeAnimation(`+${amount} Opium`, 85, 195, '#d4af37');
            this.updateUI();

            if (this.tutorialActive && this.tutorialStep === 1) {
                this.advanceTutorial();
            }
        }
    }

    buyTea(amount) {
        const cost = amount * this.teaPrice;
        if (this.silver >= cost) {
            this.silver -= cost;
            this.tea += amount;
            this.showTradeAnimation(`-${cost} Silver`, this.silverText.x, this.silverText.y, '#cc4444');
            this.showTradeAnimation(`+${amount} Tea`, 85, 395, '#228b22');
            this.updateUI();

            if (this.tutorialActive && this.tutorialStep === 4) {
                this.advanceTutorial();
            }
        }
    }

    showTradeAnimation(text, x, y, color) {
        const anim = this.add.text(x, y, text, {
            fontSize: '18px',
            fontWeight: 'bold',
            color: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: anim,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => anim.destroy()
        });
    }

    spawnOffer() {
        if (this.activeOffers.length >= 3) return;

        // Pick random port
        const portIndex = Math.floor(Math.random() * PORTS.length);
        const port = PORTS[portIndex];

        // Calculate offer
        const baseQuantity = 10 + Math.floor(Math.random() * 20);
        const basePrice = 40 + Math.floor(Math.random() * 40);
        const quantity = Math.floor(baseQuantity * port.priceBonus);
        const price = Math.floor(basePrice * port.priceBonus);

        // Create offer bubble
        const bubble = this.add.container(port.x + 40, port.y - 30);

        const bg = this.add.rectangle(0, 0, 90, 70, 0xf5deb3, 0.95);
        bg.setStrokeStyle(2, 0x654321);

        const qtyText = this.add.text(0, -20, `${quantity} chests`, {
            fontSize: '12px',
            color: '#4a3728'
        }).setOrigin(0.5);

        const priceText = this.add.text(0, 0, `@ ${price} silver`, {
            fontSize: '11px',
            color: '#4a3728'
        }).setOrigin(0.5);

        // Risk display
        const risk = this.portRisks[portIndex];
        const riskLevel = Math.min(5, Math.floor(risk * 20));
        const riskText = this.add.text(0, 20, `Risk: ${'█'.repeat(riskLevel)}${'░'.repeat(5 - riskLevel)}`, {
            fontSize: '10px',
            color: risk > 0.2 ? '#cc4444' : '#888888'
        }).setOrigin(0.5);

        bubble.add([bg, qtyText, priceText, riskText]);
        bubble.setInteractive(new Phaser.Geom.Rectangle(-45, -35, 90, 70), Phaser.Geom.Rectangle.Contains);

        bubble.setData('portIndex', portIndex);
        bubble.setData('quantity', quantity);
        bubble.setData('price', price);

        bubble.on('pointerdown', () => this.acceptOffer(bubble));
        bubble.on('pointerover', () => bg.setFillStyle(0xffe4b5));
        bubble.on('pointerout', () => bg.setFillStyle(0xf5deb3));

        this.activeOffers.push(bubble);
        this.offerGroup.add(bubble);

        // Offer expires - slower now (15 seconds)
        this.time.delayedCall(15000 / this.gameSpeed, () => {
            if (bubble.active) {
                const idx = this.activeOffers.indexOf(bubble);
                if (idx > -1) this.activeOffers.splice(idx, 1);
                bubble.destroy();
            }
        });

        if (this.tutorialActive && this.tutorialStep === 2) {
            this.advanceTutorial();
        }
    }

    acceptOffer(bubble) {
        if (this.availableShips <= 0) {
            this.setNews('No ships available!');
            return;
        }

        const portIndex = bubble.getData('portIndex');
        const quantity = bubble.getData('quantity');
        const price = bubble.getData('price');
        const port = PORTS[portIndex];

        if (this.opium < quantity) {
            this.setNews(`Not enough opium! Need ${quantity} chests.`);
            return;
        }

        // Warning for last ship
        if (this.ships === 1 && this.portRisks[portIndex] > 0.15) {
            // Skip warning for now - could add confirmation dialog
        }

        // Send ship
        this.opium -= quantity;
        this.availableShips--;

        // Remove offer
        const idx = this.activeOffers.indexOf(bubble);
        if (idx > -1) this.activeOffers.splice(idx, 1);
        bubble.destroy();

        // Create ship animation
        const ship = this.add.image(200, 500, 'ship');
        const trip = {
            ship,
            portIndex,
            quantity,
            price,
            totalValue: quantity * price,
            arrivalTime: 3000 / this.gameSpeed
        };
        this.activeTrips.push(trip);

        // Animate ship to port
        this.tweens.add({
            targets: ship,
            x: port.x,
            y: port.y,
            duration: trip.arrivalTime,
            onComplete: () => this.resolveTrip(trip)
        });

        this.updateUI();
        this.setNews(`Ship dispatched to ${port.name} with ${quantity} opium chests.`);

        if (this.tutorialActive && this.tutorialStep === 3) {
            this.advanceTutorial();
        }
    }

    resolveTrip(trip) {
        const port = PORTS[trip.portIndex];
        let risk = this.portRisks[trip.portIndex];

        // Reduce risk in early game
        if (this.year <= 1831) risk *= 0.2;

        // Roll for capture
        const roll = Math.random();

        if (roll < risk) {
            // Caught!
            const outcome = Math.random();

            if (outcome < 0.5) {
                // Escaped with partial cargo
                const partialValue = Math.floor(trip.totalValue * 0.3);
                this.silver += partialValue;
                this.totalSilverEarned += partialValue;
                this.setNews(`Ship escaped authorities! Salvaged ${partialValue} silver.`);
                this.showTradeAnimation(`+${partialValue}`, this.silverText.x, this.silverText.y, '#c0c0c0');
            } else if (outcome < 0.8 || this.bribeCard > 0) {
                // Bribed or fined
                if (this.bribeCard > 0) {
                    this.bribeCard--;
                    this.setNews('Used bribe card to escape capture!');
                    this.silver += trip.totalValue;
                    this.totalSilverEarned += trip.totalValue;
                } else {
                    const fine = Math.floor(trip.totalValue * 0.3);
                    this.silver += trip.totalValue - fine;
                    this.totalSilverEarned += trip.totalValue - fine;
                    this.finesPaid += fine;
                    this.setNews(`Paid ${fine} silver in fines. Trade completed.`);
                }
            } else {
                // Ship captured
                this.ships--;
                this.shipsLost++;
                this.setNews(`Ship captured at ${port.name}! Cargo lost.`);

                if (this.ships === 0) {
                    this.gameOver('fleet');
                    return;
                }
            }
        } else {
            // Successful trade
            this.silver += trip.totalValue;
            this.totalSilverEarned += trip.totalValue;
            this.totalOpiumSold += trip.quantity;
            this.setNews(`Trade successful! Earned ${trip.totalValue} silver at ${port.name}.`);
            this.showTradeAnimation(`+${trip.totalValue}`, this.silverText.x, this.silverText.y, '#c0c0c0');

            // Chance for bribe card
            if (Math.random() < 0.1 && this.bribeCard < 1) {
                this.bribeCard = 1;
                this.setNews('A corrupt official offers you a favor...');
            }
        }

        // Increase port risk
        this.portRisks[trip.portIndex] = Math.min(0.5, this.portRisks[trip.portIndex] + 0.05);

        // Return ship
        trip.ship.destroy();
        this.availableShips++;

        const idx = this.activeTrips.indexOf(trip);
        if (idx > -1) this.activeTrips.splice(idx, 1);

        this.updateUI();
    }

    gameTick() {
        for (let i = 0; i < this.gameSpeed; i++) {
            this.clipperTime--;

            if (this.clipperTime <= 0) {
                this.clipperArrives();
            }

            // Decay port risks
            this.portRisks = this.portRisks.map((risk, i) =>
                Math.max(PORTS[i].baseRisk, risk - 0.002));

            // Monthly tick
            if (this.clipperTime % 10 === 0) {
                this.month++;
                if (this.month > 12) {
                    this.month = 1;
                    this.advanceYear();
                }

                // Mood decay if no tea shipped
                if (this.tea < 10) {
                    this.mood = Math.max(0, this.mood - 2);
                    if (this.mood === 0) {
                        this.gameOver('mood');
                        return;
                    }
                }

                // Random price fluctuation
                if (Math.random() < 0.3) {
                    this.updatePrices();
                }

                this.updateUI();
            }
        }

        this.updateUI();
    }

    clipperArrives() {
        const quota = QUOTAS[this.year];
        const shipped = Math.min(this.tea, quota);

        if (shipped > 0) {
            this.tea -= shipped;
            this.totalTeaShipped += shipped;

            const percentMet = shipped / quota;

            if (percentMet >= 1) {
                this.mood = Math.min(100, this.mood + 15);
                this.ships++;
                this.availableShips++;
                this.setNews(`Quota met! Britain is pleased. You receive a new ship!`);
                this.showTradeAnimation('New Ship!', 85, 530, '#44ff44');
            } else if (percentMet >= 0.5) {
                this.mood = Math.max(0, this.mood - 10);
                this.setNews(`Partial shipment. Britain is disappointed.`);
            } else {
                this.mood = Math.max(0, this.mood - 20);
                this.setNews(`Failed to meet quota! Britain is furious!`);
            }

            if (this.mood === 0) {
                this.gameOver('mood');
                return;
            }
        } else {
            this.mood = Math.max(0, this.mood - 20);
            this.setNews('No tea to ship! Britain is outraged!');

            if (this.mood === 0) {
                this.gameOver('mood');
                return;
            }
        }

        this.clipperTime = this.clipperMax;
        this.updateUI();
    }

    advanceYear() {
        this.year++;

        if (this.year > 1839) {
            this.victory();
            return;
        }

        // Historical events
        if (EVENTS[this.year]) {
            const event = EVENTS[this.year];
            this.showEvent(event.title, event.text);

            if (this.year === 1836) {
                // Increase all port risks
                this.portRisks = this.portRisks.map(r => Math.min(0.5, r + 0.1));
            }
        }

        this.updatePrices();
        this.updateUI();
    }

    showEvent(title, text) {
        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

        const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 200, 0x2a1f15);
        panel.setStrokeStyle(3, 0xd4af37);

        const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, title, {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);

        const bodyText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
            fontSize: '16px',
            color: '#c4a777',
            wordWrap: { width: 450 },
            align: 'center'
        }).setOrigin(0.5);

        const continueBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, '[ CONTINUE ]', {
            fontSize: '20px',
            color: '#d4af37'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            bodyText.destroy();
            continueBtn.destroy();
        });
    }

    setNews(text) {
        this.newsText.setText(text);
    }

    showTutorial() {
        this.tutorialTexts = [];
        this.advanceTutorial();
    }

    advanceTutorial() {
        // Clear previous tutorial elements
        this.tutorialTexts.forEach(t => t.destroy());
        this.tutorialTexts = [];

        const tutorials = [
            { text: 'Welcome! Click BUY OPIUM buttons to purchase opium chests.', highlight: { x: 85, y: 150 } },
            { text: 'Great! Now wait for trade offers to appear on the map ports.', highlight: { x: 500, y: 280 } },
            { text: 'Click an offer to send your ship. Watch for risk levels!', highlight: null },
            { text: 'Your ship is trading. Wait for it to return with silver.', highlight: null },
            { text: 'Use silver to BUY TEA. You need tea to meet Britain\'s quota!', highlight: { x: 85, y: 350 } },
            { text: 'Excellent! Ship tea when the clipper arrives. Meet quotas to survive!', highlight: null },
            { text: 'Tutorial complete! Good luck, merchant.', highlight: null }
        ];

        if (this.tutorialStep >= tutorials.length) {
            this.tutorialActive = false;
            return;
        }

        const tut = tutorials[this.tutorialStep];

        const bg = this.add.rectangle(GAME_WIDTH / 2, 70, GAME_WIDTH - 40, 40, 0x000000, 0.8);
        const text = this.add.text(GAME_WIDTH / 2, 70, tut.text, {
            fontSize: '16px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.tutorialTexts.push(bg, text);

        if (tut.highlight) {
            const highlight = this.add.circle(tut.highlight.x, tut.highlight.y, 40, 0xffcc00, 0.3);
            this.tweens.add({
                targets: highlight,
                alpha: 0.1,
                yoyo: true,
                repeat: -1,
                duration: 500
            });
            this.tutorialTexts.push(highlight);
        }

        this.tutorialStep++;

        // Auto-advance for waiting steps
        if (this.tutorialStep === 4 || this.tutorialStep === 6 || this.tutorialStep === 7) {
            this.time.delayedCall(3000, () => {
                if (this.tutorialActive) this.advanceTutorial();
            });
        }
    }

    gameOver(reason) {
        let message = '';
        if (reason === 'mood') message = 'Britain has lost patience. You are ruined.';
        else if (reason === 'fleet') message = 'With no ships, your trading empire collapses.';
        else if (reason === 'bankrupt') message = 'You cannot pay your debts. Game over.';

        this.scene.start('GameOverScene', {
            year: this.year,
            reason: message,
            stats: {
                opiumSold: this.totalOpiumSold,
                teaShipped: this.totalTeaShipped,
                silverEarned: this.totalSilverEarned,
                shipsLost: this.shipsLost,
                finesPaid: this.finesPaid
            }
        });
    }

    victory() {
        this.scene.start('VictoryScene', {
            stats: {
                opiumSold: this.totalOpiumSold,
                teaShipped: this.totalTeaShipped,
                silverEarned: this.totalSilverEarned,
                shipsLost: this.shipsLost,
                finesPaid: this.finesPaid
            }
        });
    }
}

// ========== GAME OVER SCENE ==========
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.endYear = data.year || 1830;
        this.reason = data.reason || '';
        this.stats = data.stats || {};
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a0a05);

        this.add.text(GAME_WIDTH / 2, 80, 'TRADING EMPIRE COLLAPSED', {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#cc4444'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 140, `Year: ${this.endYear}`, {
            fontSize: '24px',
            color: '#c4a777'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 180, this.reason, {
            fontSize: '18px',
            color: '#888888',
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5);

        // Statistics
        this.add.text(GAME_WIDTH / 2, 250, 'FINAL STATISTICS', {
            fontSize: '20px',
            color: '#d4af37'
        }).setOrigin(0.5);

        const statLines = [
            `Opium Sold: ${this.stats.opiumSold || 0} chests`,
            `Tea Shipped: ${this.stats.teaShipped || 0} chests`,
            `Silver Earned: ${this.stats.silverEarned || 0}`,
            `Ships Lost: ${this.stats.shipsLost || 0}`,
            `Fines Paid: ${this.stats.finesPaid || 0}`
        ];

        statLines.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 290 + i * 30, line, {
                fontSize: '16px',
                color: '#c4a777'
            }).setOrigin(0.5);
        });

        // Addiction estimate
        const addicted = Math.floor((this.stats.opiumSold || 0) * 15);
        this.add.text(GAME_WIDTH / 2, 480, `Estimated Chinese Addicted: ${addicted.toLocaleString()}`, {
            fontSize: '18px',
            color: '#884488'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(GAME_WIDTH / 2, 560, '[ TRY AGAIN ]', {
            fontSize: '24px',
            color: '#d4af37'
        }).setOrigin(0.5).setInteractive();

        retryBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ========== VICTORY SCENE ==========
class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }

    init(data) {
        this.stats = data.stats || {};
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1510);

        this.add.text(GAME_WIDTH / 2, 60, 'VICTORY', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 110, 'You survived until 1839', {
            fontSize: '20px',
            color: '#c4a777'
        }).setOrigin(0.5);

        // Statistics
        this.add.text(GAME_WIDTH / 2, 170, 'TRADING RECORD', {
            fontSize: '20px',
            color: '#d4af37'
        }).setOrigin(0.5);

        const statLines = [
            `Total Opium Sold: ${this.stats.opiumSold || 0} chests`,
            `Total Tea Shipped: ${this.stats.teaShipped || 0} chests`,
            `Total Silver Earned: ${this.stats.silverEarned || 0}`,
            `Ships Lost: ${this.stats.shipsLost || 0}`,
            `Fines Paid: ${this.stats.finesPaid || 0}`
        ];

        statLines.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 210 + i * 28, line, {
                fontSize: '16px',
                color: '#c4a777'
            }).setOrigin(0.5);
        });

        // Moral reckoning
        const addicted = Math.floor((this.stats.opiumSold || 0) * 15);

        this.add.rectangle(GAME_WIDTH / 2, 430, 700, 120, 0x2a1f15);

        this.add.text(GAME_WIDTH / 2, 380, 'THE MORAL RECKONING', {
            fontSize: '18px',
            color: '#cc4444'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 410, `Your trading activities contributed to an estimated`, {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 435, `${addicted.toLocaleString()} opium addictions in China.`, {
            fontSize: '18px',
            color: '#884488'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 470, 'The First Opium War (1839-1842) resulted from conflicts just like these.', {
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(GAME_WIDTH / 2, 560, '[ RETURN TO MENU ]', {
            fontSize: '24px',
            color: '#d4af37'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== GAME CONFIG ==========
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a1510',
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
