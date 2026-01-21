// High Tea - Historical Trading Strategy
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Ship texture
        const ship = this.add.graphics();
        ship.fillStyle(0x8b4513);
        ship.fillRect(8, 12, 24, 16);
        ship.fillStyle(0xffffff);
        ship.fillTriangle(20, 0, 20, 24, 38, 14);
        ship.fillTriangle(12, 4, 12, 20, 4, 14);
        ship.generateTexture('ship', 40, 28);
        ship.destroy();

        // Port marker
        const port = this.add.graphics();
        port.fillStyle(0x654321);
        port.fillCircle(16, 16, 14);
        port.fillStyle(0x8b7355);
        port.fillCircle(16, 14, 10);
        port.generateTexture('port', 32, 32);
        port.destroy();

        // Offer bubble
        const bubble = this.add.graphics();
        bubble.fillStyle(0xf5f5dc, 0.95);
        bubble.fillRoundedRect(0, 0, 100, 60, 8);
        bubble.lineStyle(2, 0x8b7355);
        bubble.strokeRoundedRect(0, 0, 100, 60, 8);
        bubble.generateTexture('bubble', 100, 60);
        bubble.destroy();

        // Opium crate
        const opium = this.add.graphics();
        opium.fillStyle(0x4a3728);
        opium.fillRect(0, 0, 20, 16);
        opium.fillStyle(0x6b4423);
        opium.fillRect(2, 2, 16, 12);
        opium.lineStyle(1, 0x2a1a0a);
        opium.strokeRect(0, 0, 20, 16);
        opium.generateTexture('opium', 20, 16);
        opium.destroy();

        // Tea crate
        const tea = this.add.graphics();
        tea.fillStyle(0x228b22);
        tea.fillRect(0, 0, 20, 16);
        tea.fillStyle(0x2e8b2e);
        tea.fillRect(2, 2, 16, 12);
        tea.lineStyle(1, 0x0a4a0a);
        tea.strokeRect(0, 0, 20, 16);
        tea.generateTexture('tea', 20, 16);
        tea.destroy();

        // Silver coin
        const coin = this.add.graphics();
        coin.fillStyle(0xc0c0c0);
        coin.fillCircle(8, 8, 7);
        coin.fillStyle(0xe0e0e0);
        coin.fillCircle(8, 6, 4);
        coin.generateTexture('coin', 16, 16);
        coin.destroy();

        // Bribe card
        const bribe = this.add.graphics();
        bribe.fillStyle(0x8b0000);
        bribe.fillRoundedRect(0, 0, 24, 32, 4);
        bribe.fillStyle(0xffd700);
        bribe.fillCircle(12, 16, 6);
        bribe.generateTexture('bribeCard', 24, 32);
        bribe.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 450;

        // Title
        this.add.text(centerX, 80, 'HIGH TEA', {
            fontSize: '56px',
            fill: '#daa520',
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 140, 'The Opium Trade 1830-1839', {
            fontSize: '20px',
            fill: '#8b7355',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Historical context
        const context = [
            'Britain is addicted to Chinese tea,',
            'but China only accepts silver.',
            '',
            'Your solution? Sell opium.',
            '',
            'Trade opium for silver, buy tea,',
            'and satisfy Britain\'s demand.',
            '',
            'But beware - Chinese authorities',
            'are cracking down...'
        ];

        context.forEach((text, i) => {
            this.add.text(centerX, 200 + i * 26, text, {
                fontSize: '16px',
                fill: '#c0a080',
                fontFamily: 'Georgia, serif'
            }).setOrigin(0.5);
        });

        // Controls
        const controls = [
            'Click port offers to trade opium',
            'Buy opium and tea from side panels',
            'Meet tea quotas before clipper arrives',
            'Survive 9 years to win!'
        ];

        controls.forEach((text, i) => {
            this.add.text(centerX, 480 + i * 24, text, {
                fontSize: '14px',
                fill: '#888',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 600, '[ BEGIN TRADING ]', {
            fontSize: '28px',
            fill: '#daa520',
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ffd700'));
        startBtn.on('pointerout', () => startBtn.setFill('#daa520'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.year = 1830;
        this.month = 1;
        this.gameSpeed = 1;

        // Resources
        this.silver = 500;
        this.opium = 0;
        this.tea = 0;

        // Ships
        this.ships = 1;
        this.shipsInUse = 0;
        this.bribeCards = 0;

        // Britain mood
        this.mood = 80;

        // Tea quota system
        this.quotas = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];
        this.currentQuota = this.quotas[0];
        this.clipperTimer = 60000; // 60 seconds per year
        this.teaShipped = 0;

        // Stats tracking
        this.totalOpiumSold = 0;
        this.totalTeaShipped = 0;
        this.totalSilverEarned = 0;
        this.shipsLost = 0;
        this.finesPaid = 0;

        // Prices
        this.opiumPrice = 25;
        this.teaPrice = 18;
        this.updatePrices();

        // Ports
        this.ports = [
            { name: 'Lintin', x: 250, y: 250, risk: 1, baseRisk: 1 },
            { name: 'Whampoa', x: 450, y: 200, risk: 2, baseRisk: 2 },
            { name: 'Canton', x: 550, y: 300, risk: 3, baseRisk: 3 },
            { name: 'Macao', x: 350, y: 380, risk: 2, baseRisk: 2 },
            { name: 'Bocca Tigris', x: 620, y: 400, risk: 4, baseRisk: 4 }
        ];

        // Active offers
        this.offers = [];
        this.offerSprites = [];
        this.lastOfferTime = 0;
        this.offerInterval = 8000; // Slower offers per feedback

        // Ships in transit
        this.activeShips = [];

        // Create map
        this.createMap();

        // Create UI
        this.createUI();

        // Event handlers
        this.time.addEvent({
            delay: 1000,
            callback: this.gameTick,
            callbackScope: this,
            loop: true
        });

        // News ticker
        this.showNews('Welcome, trader. Britain needs tea. You need silver. China has both.');
    }

    createMap() {
        // Ocean background
        this.add.rectangle(450, 350, 500, 400, 0x1a4a5a).setDepth(0);

        // Land masses
        this.add.rectangle(200, 350, 150, 400, 0x5a7a5a).setDepth(1);
        this.add.rectangle(700, 300, 200, 500, 0x5a7a5a).setDepth(1);

        // Port markers
        this.portSprites = [];
        this.ports.forEach((port, i) => {
            const sprite = this.add.sprite(port.x, port.y, 'port').setInteractive();
            sprite.portIndex = i;
            this.portSprites.push(sprite);

            // Port name
            this.add.text(port.x, port.y + 24, port.name, {
                fontSize: '12px',
                fill: '#daa520',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Risk indicator
            const riskText = this.add.text(port.x, port.y - 24, '', {
                fontSize: '10px',
                fill: '#ff6666'
            }).setOrigin(0.5);
            port.riskText = riskText;
            this.updateRiskDisplay(port);
        });
    }

    createUI() {
        // Left panel - Buy Opium
        this.add.rectangle(70, 200, 130, 180, 0x2a1a0a, 0.9).setDepth(10);
        this.add.text(70, 120, 'BUY OPIUM', {
            fontSize: '14px',
            fill: '#daa520',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);

        this.opiumPriceText = this.add.text(70, 145, 'Price: 25', {
            fontSize: '12px',
            fill: '#ccc'
        }).setOrigin(0.5).setDepth(11);

        this.opiumStockText = this.add.text(70, 165, 'Stock: 0', {
            fontSize: '12px',
            fill: '#8b7355'
        }).setOrigin(0.5).setDepth(11);

        // Buy buttons
        [5, 10, 15].forEach((amount, i) => {
            const btn = this.add.text(30 + i * 40, 195, `[${amount}]`, {
                fontSize: '14px',
                fill: '#8f8'
            }).setOrigin(0.5).setDepth(11).setInteractive();

            btn.on('pointerover', () => btn.setFill('#afa'));
            btn.on('pointerout', () => btn.setFill('#8f8'));
            btn.on('pointerdown', () => this.buyOpium(amount));
        });

        // Left panel - Buy Tea
        this.add.rectangle(70, 400, 130, 180, 0x0a2a0a, 0.9).setDepth(10);
        this.add.text(70, 320, 'BUY TEA', {
            fontSize: '14px',
            fill: '#228b22',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);

        this.teaPriceText = this.add.text(70, 345, 'Price: 18', {
            fontSize: '12px',
            fill: '#ccc'
        }).setOrigin(0.5).setDepth(11);

        this.teaStockText = this.add.text(70, 365, 'Stock: 0', {
            fontSize: '12px',
            fill: '#228b22'
        }).setOrigin(0.5).setDepth(11);

        [5, 10, 15].forEach((amount, i) => {
            const btn = this.add.text(30 + i * 40, 395, `[${amount}]`, {
                fontSize: '14px',
                fill: '#4a4'
            }).setOrigin(0.5).setDepth(11).setInteractive();

            btn.on('pointerover', () => btn.setFill('#6c6'));
            btn.on('pointerout', () => btn.setFill('#4a4'));
            btn.on('pointerdown', () => this.buyTea(amount));
        });

        // Top bar
        this.add.rectangle(450, 40, 900, 70, 0x1a1510, 0.95).setDepth(10);

        this.yearText = this.add.text(80, 25, 'Year: 1830', {
            fontSize: '20px',
            fill: '#daa520',
            fontFamily: 'Georgia'
        }).setDepth(11);

        this.moodBar = this.add.rectangle(350, 30, 150, 20, 0x44aa44).setDepth(11);
        this.moodBarBg = this.add.rectangle(350, 30, 150, 20, 0x333333).setDepth(10);
        this.add.text(270, 30, 'MOOD:', {
            fontSize: '12px',
            fill: '#888'
        }).setOrigin(0, 0.5).setDepth(11);

        this.silverText = this.add.text(550, 25, 'Silver: 500', {
            fontSize: '18px',
            fill: '#c0c0c0',
            fontFamily: 'Arial'
        }).setDepth(11);

        this.shipsText = this.add.text(700, 25, 'Ships: 1', {
            fontSize: '16px',
            fill: '#8b7355'
        }).setDepth(11);

        this.bribeText = this.add.text(800, 25, 'Bribes: 0', {
            fontSize: '14px',
            fill: '#8b0000'
        }).setDepth(11);

        // Bottom panel - Quota
        this.add.rectangle(450, 620, 900, 80, 0x1a1510, 0.95).setDepth(10);

        this.quotaText = this.add.text(200, 600, 'Tea Quota: 0 / 60', {
            fontSize: '16px',
            fill: '#228b22'
        }).setDepth(11);

        this.clipperText = this.add.text(200, 625, 'Clipper arrives in: 60s', {
            fontSize: '14px',
            fill: '#888'
        }).setDepth(11);

        // Speed controls
        this.add.text(600, 600, 'Speed:', {
            fontSize: '12px',
            fill: '#888'
        }).setDepth(11);

        ['1x', '2x', '3x'].forEach((speed, i) => {
            const btn = this.add.text(660 + i * 40, 600, `[${speed}]`, {
                fontSize: '14px',
                fill: i === 0 ? '#ff8' : '#888'
            }).setDepth(11).setInteractive();

            btn.speedValue = i + 1;
            btn.on('pointerdown', () => {
                this.gameSpeed = btn.speedValue;
                this.children.list.filter(c => c.speedValue).forEach(b => {
                    b.setFill(b.speedValue === this.gameSpeed ? '#ff8' : '#888');
                });
            });
        });

        // News ticker
        this.newsText = this.add.text(450, 655, '', {
            fontSize: '13px',
            fill: '#c0a080',
            fontFamily: 'Georgia',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(11);
    }

    gameTick() {
        // Update based on game speed
        for (let i = 0; i < this.gameSpeed; i++) {
            this.clipperTimer -= 1000;

            // Spawn offers
            if (Date.now() - this.lastOfferTime > this.offerInterval / this.gameSpeed) {
                this.spawnOffer();
                this.lastOfferTime = Date.now();
            }

            // Update active ships
            this.updateShips();

            // Check clipper arrival
            if (this.clipperTimer <= 0) {
                this.clipperArrives();
            }

            // Random events
            if (Math.random() < 0.02) {
                this.randomEvent();
            }
        }

        this.updateUI();
    }

    spawnOffer() {
        if (this.offers.length >= 3) return;

        const port = Phaser.Utils.Array.GetRandom(this.ports);
        const yearIndex = this.year - 1830;

        // Quantity based on port
        const baseQty = port.risk * 5;
        const quantity = Phaser.Math.Between(baseQty, baseQty + 15);

        // Price based on year and risk
        const basePrice = 40 + yearIndex * 8;
        const priceBonus = port.risk * 5;
        const price = Phaser.Math.Between(basePrice + priceBonus - 10, basePrice + priceBonus + 10);

        const offer = {
            port: port,
            quantity: quantity,
            price: price,
            timer: 15000, // 15 seconds (slower per feedback)
            x: port.x + Phaser.Math.Between(-30, 30),
            y: port.y - 50
        };

        this.offers.push(offer);

        // Create visual
        const bubble = this.add.sprite(offer.x, offer.y, 'bubble').setInteractive().setDepth(20);
        const text = this.add.text(offer.x, offer.y - 10, `${quantity} @ ${price}`, {
            fontSize: '12px',
            fill: '#4a3728',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        const acceptBtn = this.add.text(offer.x, offer.y + 15, '[ACCEPT]', {
            fontSize: '11px',
            fill: '#228b22'
        }).setOrigin(0.5).setDepth(21).setInteractive();

        acceptBtn.on('pointerover', () => acceptBtn.setFill('#44aa44'));
        acceptBtn.on('pointerout', () => acceptBtn.setFill('#228b22'));
        acceptBtn.on('pointerdown', () => this.acceptOffer(offer));

        offer.bubble = bubble;
        offer.text = text;
        offer.acceptBtn = acceptBtn;
    }

    acceptOffer(offer) {
        // Check requirements
        if (this.opium < offer.quantity) {
            this.showNews('Not enough opium in stock!');
            return;
        }

        const availableShips = this.ships - this.shipsInUse;
        if (availableShips <= 0) {
            this.showNews('No ships available!');
            return;
        }

        // Warning for last ship on high risk
        if (availableShips === 1 && this.ships === 1 && offer.port.risk >= 3) {
            this.showNews('Warning: Risking your only ship!');
        }

        // Deduct opium and ship
        this.opium -= offer.quantity;
        this.shipsInUse++;

        // Create ship in transit
        const ship = {
            port: offer.port,
            quantity: offer.quantity,
            price: offer.price,
            totalValue: offer.quantity * offer.price,
            travelTime: 4000, // 4 second travel
            returning: false
        };

        // Visual ship
        ship.sprite = this.add.sprite(150, 500, 'ship').setDepth(15);
        this.tweens.add({
            targets: ship.sprite,
            x: offer.port.x,
            y: offer.port.y,
            duration: ship.travelTime,
            onComplete: () => this.shipArrives(ship)
        });

        this.activeShips.push(ship);

        // Remove offer
        this.removeOffer(offer);

        this.showNews(`Ship dispatched to ${offer.port.name} with ${offer.quantity} chests.`);
    }

    shipArrives(ship) {
        const port = ship.port;

        // Calculate capture chance (reduced early game per feedback)
        const yearIndex = this.year - 1830;
        let captureChance = (port.risk * 5) / 100;

        // Early game protection
        if (yearIndex < 2) {
            captureChance *= 0.2;
        } else if (yearIndex < 4) {
            captureChance *= 0.5;
        }

        // Increase port risk
        port.risk = Math.min(5, port.risk + 0.3);
        this.updateRiskDisplay(port);

        const roll = Math.random();

        if (roll < captureChance) {
            // Capture event
            this.handleCapture(ship);
        } else {
            // Success!
            this.handleSuccess(ship);
        }
    }

    handleCapture(ship) {
        // Sub-outcomes
        const outcome = Math.random();

        if (outcome < 0.6) {
            // Escaped - no silver but ship safe
            this.showNews(`Ship escaped authorities at ${ship.port.name}! No sale made.`);
            // Give small consolation per feedback (avoid softlock)
            const consolation = Math.floor(ship.totalValue * 0.1);
            this.silver += consolation;
            this.showTradeAnimation(ship.sprite.x, ship.sprite.y, consolation, 0x888888);
        } else if (outcome < 0.8) {
            // Bribed/Fined
            const fine = Math.floor(ship.totalValue * 0.25);
            this.silver -= Math.min(fine, this.silver);
            this.finesPaid += fine;
            this.showNews(`Ship fined ${fine} silver at ${ship.port.name}!`);
            this.showTradeAnimation(ship.sprite.x, ship.sprite.y, -fine, 0xff4444);
        } else if (outcome < 0.95) {
            // Cargo confiscated
            this.showNews(`Cargo confiscated at ${ship.port.name}! Ship returns empty.`);
        } else {
            // Ship captured!
            if (this.bribeCards > 0) {
                // Offer bribe
                this.offerBribe(ship);
                return;
            }

            this.ships--;
            this.shipsLost++;
            ship.sprite.destroy();
            this.showNews(`SHIP CAPTURED at ${ship.port.name}! Fleet reduced.`);

            if (this.ships <= 0) {
                this.gameOver('fleet');
                return;
            }
        }

        // Return ship
        this.returnShip(ship);
    }

    handleSuccess(ship) {
        const earned = ship.totalValue;
        this.silver += earned;
        this.totalSilverEarned += earned;
        this.totalOpiumSold += ship.quantity;

        this.showNews(`Trade successful at ${ship.port.name}! Earned ${earned} silver.`);
        this.showTradeAnimation(ship.sprite.x, ship.sprite.y, earned, 0x44ff44);

        this.returnShip(ship);
    }

    returnShip(ship) {
        this.tweens.add({
            targets: ship.sprite,
            x: 150,
            y: 500,
            duration: 3000,
            onComplete: () => {
                ship.sprite.destroy();
                this.shipsInUse--;
                const idx = this.activeShips.indexOf(ship);
                if (idx > -1) this.activeShips.splice(idx, 1);
            }
        });
    }

    offerBribe(ship) {
        // Simple auto-use for now
        this.bribeCards--;
        this.showNews('Bribe card used! Ship escaped capture.');
        this.returnShip(ship);
    }

    showTradeAnimation(x, y, amount, color) {
        const sign = amount >= 0 ? '+' : '';
        const text = this.add.text(x, y, `${sign}${amount}`, {
            fontSize: '24px',
            fill: Phaser.Display.Color.IntegerToColor(color).rgba,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    removeOffer(offer) {
        if (offer.bubble) offer.bubble.destroy();
        if (offer.text) offer.text.destroy();
        if (offer.acceptBtn) offer.acceptBtn.destroy();

        const idx = this.offers.indexOf(offer);
        if (idx > -1) this.offers.splice(idx, 1);
    }

    updateShips() {
        // Expire old offers
        this.offers.forEach(offer => {
            offer.timer -= 1000 * this.gameSpeed;
            if (offer.timer <= 0) {
                this.removeOffer(offer);
            }
        });

        // Decay port risk
        this.ports.forEach(port => {
            port.risk = Math.max(port.baseRisk, port.risk - 0.01);
            this.updateRiskDisplay(port);
        });
    }

    updateRiskDisplay(port) {
        const bars = Math.round(port.risk);
        let riskStr = '';
        for (let i = 0; i < bars; i++) riskStr += '█';
        for (let i = bars; i < 5; i++) riskStr += '░';
        port.riskText.setText(riskStr);
        port.riskText.setFill(port.risk >= 4 ? '#ff4444' : (port.risk >= 3 ? '#ffaa44' : '#88ff88'));
    }

    buyOpium(amount) {
        const cost = amount * this.opiumPrice;
        if (this.silver >= cost) {
            this.silver -= cost;
            this.opium += amount;
            this.showTradeAnimation(70, 200, -cost, 0xff8888);
        } else {
            this.showNews('Not enough silver!');
        }
    }

    buyTea(amount) {
        const cost = amount * this.teaPrice;
        if (this.silver >= cost) {
            this.silver -= cost;
            this.tea += amount;
            this.showTradeAnimation(70, 400, -cost, 0x88ff88);
        } else {
            this.showNews('Not enough silver!');
        }
    }

    clipperArrives() {
        // Ship tea to Britain
        const shipped = Math.min(this.tea, this.currentQuota);
        this.tea -= shipped;
        this.teaShipped = shipped;
        this.totalTeaShipped += shipped;

        // Check quota
        if (shipped >= this.currentQuota) {
            // Success!
            this.mood = Math.min(100, this.mood + 15);
            this.ships++;
            this.showNews(`Tea quota met! Britain is pleased. New ship acquired!`);

            if (shipped >= this.currentQuota * 1.2) {
                this.mood = Math.min(100, this.mood + 10);
                this.showNews('Exceeded quota! Britain is very pleased!');
            }
        } else {
            // Failed
            const shortfall = ((this.currentQuota - shipped) / this.currentQuota) * 100;
            this.mood -= 20 + Math.floor(shortfall / 10) * 3;
            this.showNews(`Tea quota missed! Only shipped ${shipped}/${this.currentQuota}. Britain is displeased.`);
        }

        // Next year
        this.advanceYear();
    }

    advanceYear() {
        this.year++;

        if (this.year > 1839) {
            this.victory();
            return;
        }

        // Update quota
        const yearIndex = this.year - 1830;
        this.currentQuota = this.quotas[yearIndex];

        // Reset timer
        this.clipperTimer = 60000;
        this.teaShipped = 0;

        // Update prices
        this.updatePrices();

        // Historical events
        this.checkHistoricalEvents();

        // Chance for bribe card
        if (Math.random() < 0.2 + yearIndex * 0.05) {
            this.bribeCards = Math.min(1, this.bribeCards + 1);
            this.showNews('A corrupt official offers his services...');
        }

        // Check mood
        if (this.mood <= 0) {
            this.gameOver('mood');
            return;
        }
    }

    updatePrices() {
        const yearIndex = this.year - 1830;

        // Opium prices increase over time
        const opiumBase = 20 + yearIndex * 10;
        this.opiumPrice = opiumBase + Phaser.Math.Between(-5, 10);

        // Tea prices increase over time
        const teaBase = 15 + yearIndex * 5;
        this.teaPrice = teaBase + Phaser.Math.Between(-3, 5);
    }

    checkHistoricalEvents() {
        switch (this.year) {
            case 1832:
                this.showNews('1832: Chinese merchants grow cautious. Offers may be scarcer.');
                this.offerInterval = 10000;
                break;
            case 1833:
                this.showNews('1833: Dealing houses merge! Opium prices soar!');
                this.opiumPrice = Math.floor(this.opiumPrice * 1.5);
                break;
            case 1836:
                this.showNews('1836: Commissioner Lin appointed! Risk levels increase!');
                this.ports.forEach(p => {
                    p.risk += 1;
                    p.baseRisk += 1;
                });
                break;
            case 1839:
                this.showNews('1839: Lin demands opium surrender! This is the final year!');
                break;
        }
    }

    randomEvent() {
        const events = [
            () => {
                this.opiumPrice = Math.floor(this.opiumPrice * 0.8);
                this.showNews('Market surplus! Opium prices drop temporarily.');
            },
            () => {
                this.teaPrice = Math.floor(this.teaPrice * 0.85);
                this.showNews('Good tea harvest! Prices fall.');
            },
            () => {
                this.mood = Math.min(100, this.mood + 5);
                this.showNews('Britain reports tea sales are strong!');
            }
        ];

        Phaser.Utils.Array.GetRandom(events)();
    }

    updateUI() {
        this.yearText.setText(`Year: ${this.year}`);
        this.silverText.setText(`Silver: ${this.silver}`);
        this.shipsText.setText(`Ships: ${this.ships - this.shipsInUse}/${this.ships}`);
        this.bribeText.setText(`Bribes: ${this.bribeCards}`);

        this.opiumPriceText.setText(`Price: ${this.opiumPrice}`);
        this.opiumStockText.setText(`Stock: ${this.opium}`);
        this.teaPriceText.setText(`Price: ${this.teaPrice}`);
        this.teaStockText.setText(`Stock: ${this.tea}`);

        this.quotaText.setText(`Tea Quota: ${this.teaShipped} / ${this.currentQuota}`);
        this.clipperText.setText(`Clipper arrives in: ${Math.ceil(this.clipperTimer / 1000)}s`);

        // Mood bar
        const moodPercent = this.mood / 100;
        this.moodBar.width = 150 * moodPercent;
        this.moodBar.fillColor = this.mood > 50 ? 0x44aa44 : (this.mood > 25 ? 0xaaaa44 : 0xaa4444);
    }

    showNews(message) {
        this.newsText.setText(message);
    }

    gameOver(reason) {
        let message = '';
        switch (reason) {
            case 'mood':
                message = 'Britain has lost patience. You are ruined.';
                break;
            case 'fleet':
                message = 'With no ships, your trading empire collapses.';
                break;
            case 'bankruptcy':
                message = 'You cannot pay your debts. Game over.';
                break;
        }

        this.scene.start('GameOverScene', {
            victory: false,
            year: this.year,
            message: message,
            stats: this.getStats()
        });
    }

    victory() {
        this.scene.start('GameOverScene', {
            victory: true,
            year: this.year,
            message: 'You survived the opium trade!',
            stats: this.getStats()
        });
    }

    getStats() {
        return {
            teaShipped: this.totalTeaShipped,
            opiumSold: this.totalOpiumSold,
            silverEarned: this.totalSilverEarned,
            shipsLost: this.shipsLost,
            finesPaid: this.finesPaid,
            addicted: Math.floor(this.totalOpiumSold * 15) // Estimated addictions
        };
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory;
        this.year = data.year;
        this.message = data.message;
        this.stats = data.stats;
    }

    create() {
        const centerX = 450;

        if (this.victory) {
            this.add.text(centerX, 80, 'VICTORY', {
                fontSize: '56px',
                fill: '#daa520',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);

            this.add.text(centerX, 140, this.message, {
                fontSize: '20px',
                fill: '#8f8',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 80, 'GAME OVER', {
                fontSize: '56px',
                fill: '#8b0000',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);

            this.add.text(centerX, 140, this.message, {
                fontSize: '18px',
                fill: '#f88',
                fontFamily: 'Georgia'
            }).setOrigin(0.5);

            this.add.text(centerX, 170, `Fell in ${this.year}`, {
                fontSize: '16px',
                fill: '#888'
            }).setOrigin(0.5);
        }

        // Statistics
        this.add.text(centerX, 220, '— Your Legacy —', {
            fontSize: '24px',
            fill: '#daa520',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);

        const stats = [
            `Tea shipped to Britain: ${this.stats.teaShipped} chests`,
            `Opium sold to China: ${this.stats.opiumSold} chests`,
            `Total silver earned: ${this.stats.silverEarned}`,
            `Ships lost: ${this.stats.shipsLost}`,
            `Fines paid: ${this.stats.finesPaid}`,
            '',
            `Estimated Chinese addicted: ${this.stats.addicted.toLocaleString()}`
        ];

        stats.forEach((text, i) => {
            const color = i === 6 ? '#ff6666' : '#c0a080';
            this.add.text(centerX, 260 + i * 28, text, {
                fontSize: '16px',
                fill: color,
                fontFamily: 'Georgia'
            }).setOrigin(0.5);
        });

        // Historical note
        this.add.text(centerX, 500, 'The First Opium War (1839-1842) resulted from conflicts like these.', {
            fontSize: '14px',
            fill: '#888',
            fontFamily: 'Georgia',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.text(centerX, 525, 'Britain\'s victory forced China to cede Hong Kong.', {
            fontSize: '14px',
            fill: '#888',
            fontFamily: 'Georgia',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Restart button
        const restartBtn = this.add.text(centerX, 600, '[ PLAY AGAIN ]', {
            fontSize: '28px',
            fill: '#daa520',
            fontFamily: 'Georgia'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#ffd700'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#daa520'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(centerX, 650, '[ MAIN MENU ]', {
            fontSize: '18px',
            fill: '#888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1510',
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
