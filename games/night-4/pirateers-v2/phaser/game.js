// Pirateers - Naval Adventure
// Top-down pirate ship action game

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;

// Colors
const COLORS = {
    WATER: 0x1a3a5c,
    WATER_DEEP: 0x0a2a4c,
    WATER_LIGHT: 0x2a4a6c,
    SAND: 0xd4b896,
    GRASS: 0x4a8c4a,
    PLAYER: 0x8b4513,
    ENEMY_MERCHANT: 0xdaa520,
    ENEMY_NAVY: 0x2040a0,
    ENEMY_PIRATE: 0x404040,
    CANNONBALL: 0x333333,
    GOLD: 0xffd700,
    UI_BG: 0x1a1a2e,
    UI_BORDER: 0x4a4a6a
};

// Game state
const gameData = {
    day: 1,
    gold: 100,
    dayTimeRemaining: 180,
    state: 'title', // title, base, sailing, treasure, kraken, victory
    ship: {
        type: 'balanced',
        armor: 100,
        maxArmor: 100,
        speed: 1,
        reload: 1,
        capacity: 10,
        firepower: 1
    },
    cargo: [],
    cargoMax: 10,
    quests: [],
    activeQuests: [],
    neptunesPieces: [],
    weapons: ['cannons'],
    selectedWeapon: 0,
    statistics: {
        shipsDestroyed: 0,
        goldEarned: 0,
        daysPlayed: 0,
        fortsDestroyed: 0,
        distanceSailed: 0,
        treasuresFound: 0
    },
    // New systems
    crew: {
        morale: 100,
        size: 10,
        maxSize: 10
    },
    reputation: {
        merchants: 0,
        navy: 0,
        pirates: 0
    },
    weather: {
        type: 'clear', // clear, cloudy, rainy, stormy
        windDirection: 0,
        windStrength: 0
    },
    achievements: [],
    shipCondition: 100 // percentage, affects performance
};

// Weather types
const WEATHER_TYPES = {
    clear: { visibility: 1.0, speedMod: 1.0, damageMod: 1.0 },
    cloudy: { visibility: 0.9, speedMod: 1.0, damageMod: 1.0 },
    rainy: { visibility: 0.7, speedMod: 0.9, damageMod: 0.9 },
    stormy: { visibility: 0.5, speedMod: 0.7, damageMod: 1.2 }
};

// Achievement definitions
const ACHIEVEMENTS = {
    first_kill: { name: 'First Blood', desc: 'Destroy your first ship', check: () => gameData.statistics.shipsDestroyed >= 1 },
    ship_hunter: { name: 'Ship Hunter', desc: 'Destroy 25 ships', check: () => gameData.statistics.shipsDestroyed >= 25 },
    treasure_seeker: { name: 'Treasure Seeker', desc: 'Find 3 treasures', check: () => gameData.statistics.treasuresFound >= 3 },
    wealthy: { name: 'Wealthy Captain', desc: 'Earn 5000 gold total', check: () => gameData.statistics.goldEarned >= 5000 },
    fort_crusher: { name: 'Fort Crusher', desc: 'Destroy 5 forts', check: () => gameData.statistics.fortsDestroyed >= 5 },
    survivor: { name: 'Survivor', desc: 'Play for 10 days', check: () => gameData.statistics.daysPlayed >= 10 },
    kraken_slayer: { name: 'Kraken Slayer', desc: 'Defeat the Kraken', check: () => gameData.achievements.includes('kraken_defeated') }
};

// Item types for trading
const CARGO_ITEMS = {
    rum: { name: 'Rum Barrel', value: 15, rarity: 'common' },
    spices: { name: 'Spices', value: 25, rarity: 'common' },
    silk: { name: 'Silk Bales', value: 40, rarity: 'uncommon' },
    gold_bars: { name: 'Gold Bars', value: 75, rarity: 'uncommon' },
    gems: { name: 'Gems', value: 120, rarity: 'rare' },
    artifact: { name: 'Ancient Artifact', value: 200, rarity: 'rare' },
    treasure_map: { name: 'Treasure Map', value: 0, rarity: 'legendary', special: 'treasure' }
};

// Enemy types
const ENEMY_TYPES = {
    merchant: { name: 'Merchant Ship', hp: 50, speed: 60, damage: 5, goldMin: 20, goldMax: 40, lootSlots: 2, color: COLORS.ENEMY_MERCHANT },
    navy_sloop: { name: 'Navy Sloop', hp: 80, speed: 100, damage: 12, goldMin: 30, goldMax: 50, lootSlots: 1, color: COLORS.ENEMY_NAVY },
    navy_frigate: { name: 'Navy Frigate', hp: 150, speed: 80, damage: 20, goldMin: 60, goldMax: 100, lootSlots: 3, color: COLORS.ENEMY_NAVY },
    pirate_raider: { name: 'Pirate Raider', hp: 100, speed: 120, damage: 15, goldMin: 40, goldMax: 70, lootSlots: 2, color: COLORS.ENEMY_PIRATE },
    pirate_captain: { name: 'Pirate Captain', hp: 200, speed: 90, damage: 25, goldMin: 100, goldMax: 150, lootSlots: 4, color: COLORS.ENEMY_PIRATE },
    ghost_ship: { name: 'Ghost Ship', hp: 175, speed: 110, damage: 30, goldMin: 80, goldMax: 120, lootSlots: 3, color: 0x88aacc }
};

// Island definitions
const ISLANDS = [
    { x: 400, y: 400, radius: 120, name: 'Port Haven', type: 'home', prices: { buy: 1.0, sell: 1.0 } },
    { x: 1200, y: 300, radius: 80, name: 'Trade Isle', type: 'trading', prices: { buy: 0.9, sell: 1.2 } },
    { x: 2000, y: 500, radius: 100, name: 'Smugglers Cove', type: 'black_market', prices: { buy: 0.7, sell: 1.5 } },
    { x: 600, y: 1500, radius: 90, name: 'Navy Outpost', type: 'military', prices: { buy: 1.1, sell: 0.8 } },
    { x: 1600, y: 1800, radius: 110, name: 'Treasure Island', type: 'treasure', prices: { buy: 1.0, sell: 1.0 } },
    { x: 2100, y: 1400, radius: 70, name: 'Ghost Isle', type: 'cursed', prices: { buy: 1.3, sell: 1.8 } }
];

// Forts
const FORTS = [
    { x: 800, y: 1000, name: 'Watchtower', hp: 150, damage: 15, range: 250, cannons: 1 },
    { x: 1400, y: 600, name: 'Coastal Fort', hp: 300, damage: 20, range: 300, cannons: 3 },
    { x: 1900, y: 1100, name: 'Naval Fortress', hp: 500, damage: 25, range: 350, cannons: 5 }
];

// Environmental hazards
const HAZARDS = [
    { x: 700, y: 700, type: 'reef', radius: 60, damage: 5 },
    { x: 1500, y: 400, type: 'reef', radius: 50, damage: 5 },
    { x: 1800, y: 900, type: 'reef', radius: 70, damage: 5 },
    { x: 1000, y: 1300, type: 'whirlpool', radius: 80, pullStrength: 50 },
    { x: 2200, y: 800, type: 'whirlpool', radius: 70, pullStrength: 40 }
];

// Crew effects on morale
const MORALE_EFFECTS = {
    high: { speedBonus: 1.1, reloadBonus: 1.1 },
    normal: { speedBonus: 1.0, reloadBonus: 1.0 },
    low: { speedBonus: 0.85, reloadBonus: 0.85 },
    critical: { speedBonus: 0.7, reloadBonus: 0.7 }
};

function getMoraleLevel() {
    if (gameData.crew.morale >= 80) return 'high';
    if (gameData.crew.morale >= 50) return 'normal';
    if (gameData.crew.morale >= 25) return 'low';
    return 'critical';
}

function checkAchievements(scene) {
    Object.keys(ACHIEVEMENTS).forEach(key => {
        if (!gameData.achievements.includes(key) && ACHIEVEMENTS[key].check()) {
            gameData.achievements.push(key);
            if (scene && scene.showFloatingText) {
                scene.showFloatingText(GAME_WIDTH / 2, 100, 'Achievement: ' + ACHIEVEMENTS[key].name + '!', '#ffd700', 20);
            }
        }
    });
}

// Boot Scene - Load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Create textures programmatically
        this.createShipTexture('player_ship', COLORS.PLAYER, 40, 20);
        this.createShipTexture('merchant_ship', COLORS.ENEMY_MERCHANT, 35, 18);
        this.createShipTexture('navy_ship', COLORS.ENEMY_NAVY, 38, 19);
        this.createShipTexture('pirate_ship', COLORS.ENEMY_PIRATE, 36, 18);
        this.createShipTexture('ghost_ship', 0x88aacc, 38, 19);
        this.createCircleTexture('cannonball', 6, COLORS.CANNONBALL);
        this.createCircleTexture('gold_coin', 8, COLORS.GOLD);
        this.createCircleTexture('loot', 10, 0xaa8844);
        this.createCircleTexture('wake', 4, 0x4a6a8c);

        this.scene.start('TitleScene');
    }

    createShipTexture(key, color, width, height) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Hull
        graphics.fillStyle(color);
        graphics.fillRect(0, height * 0.2, width, height * 0.6);

        // Bow (front)
        graphics.beginPath();
        graphics.moveTo(width, height * 0.5);
        graphics.lineTo(width + 10, height * 0.5);
        graphics.lineTo(width, height * 0.3);
        graphics.lineTo(width, height * 0.7);
        graphics.closePath();
        graphics.fill();

        // Mast
        graphics.fillStyle(0x8b7355);
        graphics.fillRect(width * 0.3, 0, 3, height);
        graphics.fillRect(width * 0.6, 2, 3, height - 4);

        // Sails
        graphics.fillStyle(0xf5f5dc);
        graphics.fillRect(width * 0.2, 2, 15, 6);
        graphics.fillRect(width * 0.5, 4, 12, 5);

        graphics.generateTexture(key, width + 15, height);
        graphics.destroy();
    }

    createCircleTexture(key, radius, color) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(color);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(key, radius * 2, radius * 2);
        graphics.destroy();
    }
}

// Title Scene
class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        // Animated water background
        this.water = [];
        for (let i = 0; i < 20; i++) {
            const wave = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                100 + Math.random() * 200,
                5,
                0x2a4a6c,
                0.3
            );
            wave.phase = Math.random() * Math.PI * 2;
            this.water.push(wave);
        }

        // Title
        this.add.text(GAME_WIDTH / 2, 150, 'PIRATEERS', {
            fontSize: '64px',
            fontFamily: 'Georgia, serif',
            color: '#ffd700',
            stroke: '#8b4513',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, 'Naval Adventure', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#f5f5dc'
        }).setOrigin(0.5);

        // Ship selection
        this.add.text(GAME_WIDTH / 2, 320, 'Choose Your Ship:', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const ships = [
            { type: 'balanced', name: 'Balanced Sloop', desc: 'Armor: 100 | Speed: 100 | Cargo: 10' },
            { type: 'fast', name: 'Fast Cutter', desc: 'Armor: 75 | Speed: 130 | Cargo: 8' },
            { type: 'heavy', name: 'Heavy Galleon', desc: 'Armor: 150 | Speed: 70 | Cargo: 15' }
        ];

        ships.forEach((ship, i) => {
            const y = 380 + i * 60;
            const btn = this.add.rectangle(GAME_WIDTH / 2, y, 300, 50, 0x4a4a6a)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => btn.setFillStyle(0x6a6a8a))
                .on('pointerout', () => btn.setFillStyle(0x4a4a6a))
                .on('pointerdown', () => this.selectShip(ship.type));

            this.add.text(GAME_WIDTH / 2, y - 8, ship.name, {
                fontSize: '18px',
                color: '#ffd700'
            }).setOrigin(0.5);

            this.add.text(GAME_WIDTH / 2, y + 12, ship.desc, {
                fontSize: '12px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Continue button (if save exists)
        if (hasSave()) {
            const continueBtn = this.add.rectangle(GAME_WIDTH / 2, 560, 200, 40, 0x2a6a2a)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => continueBtn.setFillStyle(0x4a8a4a))
                .on('pointerout', () => continueBtn.setFillStyle(0x2a6a2a))
                .on('pointerdown', () => this.continueGame());

            this.add.text(GAME_WIDTH / 2, 560, 'CONTINUE GAME', {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);
        }

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'W/S: Speed | A/D: Turn | Space: Fire Cannons', {
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
    }

    continueGame() {
        if (loadGame()) {
            this.scene.start('BaseScene');
        }
    }

    selectShip(type) {
        // Reset game data for new game
        gameData.day = 1;
        gameData.gold = 100;
        gameData.dayTimeRemaining = 180;
        gameData.cargo = [];
        gameData.activeQuests = [];
        gameData.weapons = ['cannons'];
        gameData.neptunesPieces = [];
        gameData.statistics = { shipsDestroyed: 0, goldEarned: 0, daysPlayed: 0 };

        if (type === 'balanced') {
            gameData.ship = { type, armor: 100, maxArmor: 100, speed: 1, reload: 1, capacity: 10, firepower: 1 };
            gameData.cargoMax = 10;
        } else if (type === 'fast') {
            gameData.ship = { type, armor: 75, maxArmor: 75, speed: 1.3, reload: 1, capacity: 8, firepower: 1 };
            gameData.cargoMax = 8;
        } else {
            gameData.ship = { type, armor: 150, maxArmor: 150, speed: 0.7, reload: 1, capacity: 15, firepower: 1 };
            gameData.cargoMax = 15;
        }

        this.scene.start('BaseScene');
    }

    update() {
        // Animate waves
        this.water.forEach(wave => {
            wave.phase += 0.02;
            wave.y += Math.sin(wave.phase) * 0.5;
            wave.x += 0.3;
            if (wave.x > GAME_WIDTH + 100) wave.x = -100;
        });
    }
}

// Base Scene - Port/Shop
class BaseScene extends Phaser.Scene {
    constructor() {
        super('BaseScene');
    }

    create() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a1a0a);

        // Title
        this.add.text(GAME_WIDTH / 2, 30, 'PORT HAVEN', {
            fontSize: '32px',
            fontFamily: 'Georgia, serif',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Day and gold display
        this.dayText = this.add.text(20, 20, 'Day: ' + gameData.day, {
            fontSize: '18px',
            color: '#ffffff'
        });

        this.goldText = this.add.text(20, 45, 'Gold: ' + gameData.gold, {
            fontSize: '18px',
            color: '#ffd700'
        });

        // Ship stats
        this.add.text(GAME_WIDTH / 2, 80, 'Ship Stats', {
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.statsText = this.add.text(GAME_WIDTH / 2, 110,
            `Armor: ${gameData.ship.armor}/${gameData.ship.maxArmor} | Speed: ${Math.floor(gameData.ship.speed * 100)}% | Cargo: ${gameData.cargo.length}/${gameData.cargoMax}`,
            { fontSize: '14px', color: '#ffffff' }
        ).setOrigin(0.5);

        // Buttons
        this.createButton(100, 220, 'SHIPYARD', () => this.openShipyard());
        this.createButton(280, 220, 'WEAPONS', () => this.openWeapons());
        this.createButton(460, 220, 'MARKET', () => this.openMarket());
        this.createButton(640, 220, 'TAVERN', () => this.openTavern());
        this.createButton(820, 220, 'QUESTS', () => this.openQuests());

        // Set Sail button
        this.createButton(GAME_WIDTH / 2, 400, 'SET SAIL', () => this.setSail(), 200, 60, 0x2a6a2a);

        // Cargo display
        this.add.text(GAME_WIDTH / 2, 480, 'CARGO HOLD', {
            fontSize: '18px',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.cargoContainer = this.add.container(100, 510);
        this.updateCargoDisplay();

        // Menu panel (hidden by default)
        this.menuPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false);
        this.menuBg = this.add.rectangle(0, 0, 400, 350, 0x1a1a2e, 0.95).setStrokeStyle(2, 0x4a4a6a);
        this.menuTitle = this.add.text(0, -150, 'MENU', { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);
        this.menuContent = this.add.container(0, 0);
        this.menuClose = this.add.text(180, -150, 'X', { fontSize: '20px', color: '#ff4444' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeMenu());
        this.menuPanel.add([this.menuBg, this.menuTitle, this.menuContent, this.menuClose]);

        // Repair ship at base
        if (gameData.ship.armor < gameData.ship.maxArmor) {
            gameData.ship.armor = gameData.ship.maxArmor;
        }
    }

    createButton(x, y, text, callback, width = 140, height = 50, color = 0x4a4a6a) {
        const btn = this.add.rectangle(x, y, width, height, color)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(color + 0x202020))
            .on('pointerout', () => btn.setFillStyle(color))
            .on('pointerdown', callback);

        this.add.text(x, y, text, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        return btn;
    }

    updateCargoDisplay() {
        this.cargoContainer.removeAll(true);

        if (gameData.cargo.length === 0) {
            this.cargoContainer.add(this.add.text(300, 20, 'Empty - Go sail and collect loot!', {
                fontSize: '14px',
                color: '#666666'
            }));
        } else {
            gameData.cargo.forEach((item, i) => {
                const itemInfo = CARGO_ITEMS[item];
                const x = (i % 5) * 150;
                const y = Math.floor(i / 5) * 30;
                this.cargoContainer.add(this.add.text(x, y, `${itemInfo.name} (${itemInfo.value}g)`, {
                    fontSize: '12px',
                    color: itemInfo.rarity === 'rare' ? '#ffd700' : (itemInfo.rarity === 'uncommon' ? '#44aaff' : '#aaaaaa')
                }));
            });
        }
    }

    openShipyard() {
        this.menuTitle.setText('SHIPYARD');
        this.menuContent.removeAll(true);

        const upgrades = [
            { stat: 'maxArmor', name: 'Armor', current: gameData.ship.maxArmor, perLevel: 50 },
            { stat: 'speed', name: 'Speed', current: Math.floor(gameData.ship.speed * 100), perLevel: 15, percent: true },
            { stat: 'reload', name: 'Reload', current: Math.floor(gameData.ship.reload * 100), perLevel: 15, percent: true },
            { stat: 'firepower', name: 'Firepower', current: gameData.ship.firepower, perLevel: 1 }
        ];

        upgrades.forEach((upg, i) => {
            const y = -100 + i * 50;
            const level = this.getUpgradeLevel(upg.stat);
            const cost = this.getUpgradeCost(level);

            this.menuContent.add(this.add.text(-150, y, upg.name, { fontSize: '14px', color: '#ffffff' }));
            this.menuContent.add(this.add.text(-150, y + 16, `Level ${level}/10 - ${upg.current}${upg.percent ? '%' : ''}`, { fontSize: '10px', color: '#aaaaaa' }));

            if (level < 10) {
                const btn = this.add.rectangle(100, y + 8, 90, 30, 0x2a6a2a)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.buyUpgrade(upg.stat));
                this.menuContent.add(btn);
                this.menuContent.add(this.add.text(100, y + 8, `${cost}g`, { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5));
            }
        });

        // Ship Repair section
        const repairY = 110;
        const repairCost = Math.floor((100 - gameData.shipCondition) * 2);
        this.menuContent.add(this.add.text(-150, repairY, `Ship Condition: ${Math.floor(gameData.shipCondition)}%`, {
            fontSize: '14px',
            color: gameData.shipCondition > 50 ? '#44ff44' : '#ff4444'
        }));

        if (gameData.shipCondition < 100) {
            const repairBtn = this.add.rectangle(100, repairY + 5, 90, 30, 0x4a4a6a)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.repairShipCondition(repairCost));
            this.menuContent.add(repairBtn);
            this.menuContent.add(this.add.text(100, repairY + 5, `Repair ${repairCost}g`, { fontSize: '11px', color: '#ffffff' }).setOrigin(0.5));
        }

        this.menuPanel.setVisible(true);
    }

    repairShipCondition(cost) {
        if (gameData.gold >= cost) {
            gameData.gold -= cost;
            gameData.shipCondition = 100;
            this.goldText.setText('Gold: ' + gameData.gold);
            this.openShipyard();
        }
    }

    getUpgradeLevel(stat) {
        const base = stat === 'maxArmor' ? 100 : 1;
        const current = gameData.ship[stat];
        return Math.floor((current - base) / (stat === 'maxArmor' ? 50 : (stat === 'firepower' ? 1 : 0.15))) + 1;
    }

    getUpgradeCost(level) {
        const costs = [100, 200, 350, 500, 750, 1000, 1500, 2000, 3000];
        return costs[level - 1] || 9999;
    }

    buyUpgrade(stat) {
        const level = this.getUpgradeLevel(stat);
        const cost = this.getUpgradeCost(level);

        if (gameData.gold >= cost && level < 10) {
            gameData.gold -= cost;

            if (stat === 'maxArmor') {
                gameData.ship.maxArmor += 50;
                gameData.ship.armor = gameData.ship.maxArmor;
            } else if (stat === 'speed') {
                gameData.ship.speed += 0.15;
            } else if (stat === 'reload') {
                gameData.ship.reload += 0.15;
            } else if (stat === 'firepower') {
                gameData.ship.firepower += 1;
            }

            this.goldText.setText('Gold: ' + gameData.gold);
            this.statsText.setText(`Armor: ${gameData.ship.armor}/${gameData.ship.maxArmor} | Speed: ${Math.floor(gameData.ship.speed * 100)}% | Cargo: ${gameData.cargo.length}/${gameData.cargoMax}`);
            this.openShipyard();
        }
    }

    openWeapons() {
        this.menuTitle.setText('WEAPONS');
        this.menuContent.removeAll(true);

        const weapons = [
            { id: 'cannons', name: 'Standard Cannons', desc: 'Basic broadside', cost: 0 },
            { id: 'fireballs', name: 'Fireballs', desc: '40 dmg + DOT, 5 charges', cost: 500 },
            { id: 'megashot', name: 'Megashot', desc: '80 dmg, +50% range, 3 charges', cost: 750 },
            { id: 'oil_slick', name: 'Oil Slick', desc: 'Drop oil, ignite for 30 AOE, 4 charges', cost: 400 },
            { id: 'battering_ram', name: 'Battering Ram', desc: '60 dmg frontal, 3 charges', cost: 600 },
            { id: 'tortoise', name: 'Tortoise Shield', desc: '75% dmg reduction 8s, 3 charges', cost: 1000 }
        ];

        weapons.forEach((weap, i) => {
            const y = -80 + i * 50;
            const owned = gameData.weapons.includes(weap.id);

            this.menuContent.add(this.add.text(-150, y, weap.name, { fontSize: '16px', color: owned ? '#44ff44' : '#ffffff' }));
            this.menuContent.add(this.add.text(-150, y + 18, weap.desc, { fontSize: '11px', color: '#888888' }));

            if (!owned && weap.cost > 0) {
                const btn = this.add.rectangle(100, y + 10, 80, 30, 0x6a4a2a)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.buyWeapon(weap.id, weap.cost));
                this.menuContent.add(btn);
                this.menuContent.add(this.add.text(100, y + 10, `${weap.cost}g`, { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5));
            } else if (owned) {
                this.menuContent.add(this.add.text(100, y + 10, 'OWNED', { fontSize: '12px', color: '#44ff44' }).setOrigin(0.5));
            }
        });

        this.menuPanel.setVisible(true);
    }

    buyWeapon(id, cost) {
        if (gameData.gold >= cost && !gameData.weapons.includes(id)) {
            gameData.gold -= cost;
            gameData.weapons.push(id);
            this.goldText.setText('Gold: ' + gameData.gold);
            this.openWeapons();
        }
    }

    openMarket() {
        this.menuTitle.setText('MARKETPLACE');
        this.menuContent.removeAll(true);

        if (gameData.cargo.length === 0) {
            this.menuContent.add(this.add.text(0, 0, 'No cargo to sell!', { fontSize: '16px', color: '#888888' }).setOrigin(0.5));
        } else {
            let totalValue = 0;
            gameData.cargo.forEach(item => {
                totalValue += CARGO_ITEMS[item].value;
            });

            this.menuContent.add(this.add.text(0, -60, `${gameData.cargo.length} items in cargo`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5));
            this.menuContent.add(this.add.text(0, -30, `Total value: ${totalValue} gold`, { fontSize: '18px', color: '#ffd700' }).setOrigin(0.5));

            const btn = this.add.rectangle(0, 30, 150, 50, 0x2a6a2a)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.sellAllCargo(totalValue));
            this.menuContent.add(btn);
            this.menuContent.add(this.add.text(0, 30, 'SELL ALL', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5));
        }

        this.menuPanel.setVisible(true);
    }

    sellAllCargo(value) {
        gameData.gold += value;
        gameData.statistics.goldEarned += value;
        gameData.cargo = [];
        this.goldText.setText('Gold: ' + gameData.gold);
        this.updateCargoDisplay();
        this.closeMenu();
    }

    openQuests() {
        this.menuTitle.setText('QUEST BOARD');
        this.menuContent.removeAll(true);

        const quests = [
            { id: 'bounty1', name: 'Merchant Hunt', desc: 'Sink 3 merchant ships', reward: 100, target: 'merchant', count: 3 },
            { id: 'pirate1', name: 'Pirate Scourge', desc: 'Destroy 2 pirate raiders', reward: 150, target: 'pirate', count: 2 },
            { id: 'collect1', name: 'Spice Trade', desc: 'Collect 5 spice barrels', reward: 80, target: 'spices', count: 5 },
            { id: 'navy1', name: 'Navy Buster', desc: 'Sink 2 Navy ships', reward: 200, target: 'navy', count: 2 },
            { id: 'ghost1', name: 'Ghost Hunter', desc: 'Defeat 1 ghost ship', reward: 250, target: 'ghost_ship', count: 1 }
        ];

        // Add Kraken quest if player has enough Neptune's Eye pieces
        if (gameData.neptunesPieces.length >= 5) {
            quests.push({ id: 'kraken', name: 'FACE THE KRAKEN', desc: 'Final challenge - defeat the beast!', reward: 2000, special: 'kraken' });
        }

        quests.forEach((quest, i) => {
            const y = -80 + i * 60;
            const active = gameData.activeQuests.find(q => q.id === quest.id);

            this.menuContent.add(this.add.text(-150, y, quest.name, { fontSize: '16px', color: active ? '#44aaff' : '#ffffff' }));
            this.menuContent.add(this.add.text(-150, y + 18, quest.desc, { fontSize: '11px', color: '#888888' }));
            this.menuContent.add(this.add.text(100, y, `${quest.reward}g`, { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5));

            if (!active && gameData.activeQuests.length < 3) {
                const btn = this.add.rectangle(100, y + 20, 80, 25, 0x4a4a6a)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.acceptQuest(quest));
                this.menuContent.add(btn);
                this.menuContent.add(this.add.text(100, y + 20, 'Accept', { fontSize: '11px', color: '#ffffff' }).setOrigin(0.5));
            }
        });

        this.menuPanel.setVisible(true);
    }

    acceptQuest(quest) {
        // Special handling for Kraken quest
        if (quest.special === 'kraken') {
            this.scene.start('KrakenScene');
            return;
        }

        gameData.activeQuests.push({ ...quest, progress: 0 });
        this.openQuests();
    }

    openTavern() {
        this.menuTitle.setText('TAVERN');
        this.menuContent.removeAll(true);

        // Morale display
        const moraleLevel = getMoraleLevel();
        const moraleColors = { high: '#44ff44', normal: '#ffffff', low: '#ffaa44', critical: '#ff4444' };
        this.menuContent.add(this.add.text(-150, -120, `Crew Morale: ${Math.floor(gameData.crew.morale)}% (${moraleLevel})`, {
            fontSize: '16px',
            color: moraleColors[moraleLevel]
        }));

        this.menuContent.add(this.add.text(-150, -90, `Crew Size: ${gameData.crew.size}/${gameData.crew.maxSize}`, {
            fontSize: '14px',
            color: '#aaaaaa'
        }));

        // Tavern options
        const options = [
            { name: 'Buy Rum for Crew', desc: 'Boost morale by 20%', cost: 30, action: () => {
                gameData.crew.morale = Math.min(100, gameData.crew.morale + 20);
                this.openTavern();
            }},
            { name: 'Hire Sailors', desc: 'Add 2 crew members', cost: 50, action: () => {
                if (gameData.crew.size < gameData.crew.maxSize) {
                    gameData.crew.size = Math.min(gameData.crew.maxSize, gameData.crew.size + 2);
                    this.openTavern();
                }
            }},
            { name: 'Feast & Entertainment', desc: 'Restore morale to 100%', cost: 100, action: () => {
                gameData.crew.morale = 100;
                this.openTavern();
            }},
            { name: 'Expand Quarters', desc: 'Increase max crew by 5', cost: 200, action: () => {
                gameData.crew.maxSize += 5;
                this.openTavern();
            }}
        ];

        options.forEach((opt, i) => {
            const y = -40 + i * 55;
            this.menuContent.add(this.add.text(-150, y, opt.name, { fontSize: '14px', color: '#ffffff' }));
            this.menuContent.add(this.add.text(-150, y + 18, opt.desc, { fontSize: '11px', color: '#888888' }));

            const btn = this.add.rectangle(100, y + 10, 80, 30, 0x6a4a2a)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    if (gameData.gold >= opt.cost) {
                        gameData.gold -= opt.cost;
                        this.goldText.setText('Gold: ' + gameData.gold);
                        opt.action();
                    }
                });
            this.menuContent.add(btn);
            this.menuContent.add(this.add.text(100, y + 10, `${opt.cost}g`, { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5));
        });

        this.menuPanel.setVisible(true);
    }

    closeMenu() {
        this.menuPanel.setVisible(false);
    }

    setSail() {
        gameData.dayTimeRemaining = 180;
        this.scene.start('SailingScene');
    }
}

// Sailing Scene - Main gameplay
class SailingScene extends Phaser.Scene {
    constructor() {
        super('SailingScene');
    }

    create() {
        // World bounds
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Create water tiles
        this.createWater();

        // Create islands
        this.islands = [];
        this.createIslands();

        // Create forts
        this.forts = [];
        this.createForts();

        // Create hazards
        this.hazards = [];
        this.createHazards();

        // Initialize weather
        this.initializeWeather();

        // Create player ship
        this.createPlayer();

        // Create enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemies();

        // Projectiles
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Loot
        this.loot = this.physics.add.group();

        // Gold pickups
        this.goldPickups = this.physics.add.group();

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5); // Zoomed in as per feedback

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.loot, this.collectLoot, null, this);
        this.physics.add.overlap(this.player, this.goldPickups, this.collectGold, null, this);

        // UI
        this.createUI();

        // Day timer
        this.dayTimer = this.time.addEvent({
            delay: 1000,
            callback: this.tickDay,
            callbackScope: this,
            loop: true
        });

        // Fire cooldown
        this.canFire = true;
        this.lastFired = 0;
    }

    createWater() {
        // Deep water background
        for (let y = 0; y < WORLD_HEIGHT; y += 64) {
            for (let x = 0; x < WORLD_WIDTH; x += 64) {
                const color = (Math.floor(x / 64) + Math.floor(y / 64)) % 2 === 0 ? COLORS.WATER : COLORS.WATER_DEEP;
                this.add.rectangle(x + 32, y + 32, 64, 64, color);
            }
        }
    }

    createIslands() {
        ISLANDS.forEach(island => {
            // Island base
            const islandSprite = this.add.circle(island.x, island.y, island.radius, COLORS.SAND);

            // Grass center
            this.add.circle(island.x, island.y, island.radius * 0.7, COLORS.GRASS);

            // Port dock
            this.add.rectangle(island.x + island.radius - 10, island.y, 30, 15, 0x8b4513);

            // Island label
            this.add.text(island.x, island.y - island.radius - 15, island.name, {
                fontSize: '12px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Port marker
            const marker = this.add.circle(island.x + island.radius - 10, island.y, 8, 0xffd700);
            marker.island = island;

            this.islands.push({
                sprite: islandSprite,
                marker: marker,
                data: island
            });
        });
    }

    createForts() {
        FORTS.forEach(fortData => {
            // Fort base
            const fort = this.add.rectangle(fortData.x, fortData.y, 40, 40, 0x8b4513);
            fort.setStrokeStyle(2, 0x555555);

            // Fort tower
            this.add.rectangle(fortData.x, fortData.y, 20, 20, 0x666666);

            // Fort data
            fort.fortData = { ...fortData };
            fort.hp = fortData.hp;
            fort.maxHp = fortData.hp;
            fort.fireTimer = 3000;
            fort.destroyed = false;

            // Health bar
            fort.healthBarBg = this.add.rectangle(fortData.x, fortData.y - 30, 40, 4, 0x440000);
            fort.healthBar = this.add.rectangle(fortData.x, fortData.y - 30, 40, 4, 0x44aa44);

            // Label
            this.add.text(fortData.x, fortData.y - 45, fortData.name, {
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.forts.push(fort);
        });
    }

    createHazards() {
        HAZARDS.forEach(hazData => {
            let hazard;
            if (hazData.type === 'reef') {
                // Reef - jagged rocks
                hazard = this.add.circle(hazData.x, hazData.y, hazData.radius, 0x5a4a3a, 0.7);
                hazard.setStrokeStyle(3, 0x443322);

                // Add some visual detail
                for (let i = 0; i < 5; i++) {
                    const rx = hazData.x + Phaser.Math.Between(-hazData.radius/2, hazData.radius/2);
                    const ry = hazData.y + Phaser.Math.Between(-hazData.radius/2, hazData.radius/2);
                    this.add.circle(rx, ry, Phaser.Math.Between(5, 15), 0x665544);
                }

                // Warning label
                this.add.text(hazData.x, hazData.y - hazData.radius - 10, 'REEF', {
                    fontSize: '10px',
                    color: '#ff6644',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
            } else if (hazData.type === 'whirlpool') {
                // Whirlpool - spinning water
                hazard = this.add.circle(hazData.x, hazData.y, hazData.radius, 0x1a4a6a, 0.5);
                hazard.setStrokeStyle(4, 0x2a5a7a);

                // Inner spiral
                for (let i = 1; i <= 3; i++) {
                    this.add.circle(hazData.x, hazData.y, hazData.radius * (1 - i * 0.25), 0x0a3a5a, 0.6);
                }

                // Warning label
                this.add.text(hazData.x, hazData.y - hazData.radius - 10, 'WHIRLPOOL', {
                    fontSize: '10px',
                    color: '#44aaff',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
            }

            hazard.hazardData = hazData;
            this.hazards.push(hazard);
        });
    }

    initializeWeather() {
        // Randomize weather for the day
        const weatherRoll = Math.random();
        if (weatherRoll < 0.5) gameData.weather.type = 'clear';
        else if (weatherRoll < 0.75) gameData.weather.type = 'cloudy';
        else if (weatherRoll < 0.9) gameData.weather.type = 'rainy';
        else gameData.weather.type = 'stormy';

        gameData.weather.windDirection = Math.random() * Math.PI * 2;
        gameData.weather.windStrength = Math.random() * 30;

        // Create weather visual effects
        this.weatherEffects = [];
        if (gameData.weather.type === 'rainy' || gameData.weather.type === 'stormy') {
            // Rain particles
            this.rainTimer = this.time.addEvent({
                delay: 50,
                callback: this.spawnRain,
                callbackScope: this,
                loop: true
            });
        }

        if (gameData.weather.type === 'stormy') {
            // Occasional lightning
            this.lightningTimer = this.time.addEvent({
                delay: 5000,
                callback: this.flashLightning,
                callbackScope: this,
                loop: true
            });
        }
    }

    spawnRain() {
        const count = gameData.weather.type === 'stormy' ? 10 : 5;
        for (let i = 0; i < count; i++) {
            const rain = this.add.line(
                this.player.x + Phaser.Math.Between(-400, 400),
                this.player.y + Phaser.Math.Between(-300, -100),
                0, 0, 5, 15,
                0x88aacc, 0.6
            );
            this.tweens.add({
                targets: rain,
                y: rain.y + 400,
                alpha: 0,
                duration: 500,
                onComplete: () => rain.destroy()
            });
        }
    }

    flashLightning() {
        // White flash effect
        const flash = this.add.rectangle(this.player.x, this.player.y, GAME_WIDTH * 2, GAME_HEIGHT * 2, 0xffffff, 0.8);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Thunder shake
        this.cameras.main.shake(300, 0.015);

        // Random chance to damage ship in storm
        if (Math.random() < 0.2) {
            const damage = Phaser.Math.Between(5, 15);
            this.player.hp -= damage;
            gameData.ship.armor = Math.max(0, this.player.hp);
            this.showFloatingText(this.player.x, this.player.y - 30, 'Lightning! -' + damage, '#ffff44');
        }
    }

    updateHazards() {
        this.hazards.forEach(hazard => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hazard.hazardData.x, hazard.hazardData.y);

            if (dist < hazard.hazardData.radius) {
                if (hazard.hazardData.type === 'reef') {
                    // Reef damage - periodic
                    if (!this.lastReefDamage || this.time.now - this.lastReefDamage > 500) {
                        this.player.hp -= hazard.hazardData.damage;
                        gameData.ship.armor = Math.max(0, this.player.hp);
                        this.showFloatingText(this.player.x, this.player.y - 20, 'Reef! -' + hazard.hazardData.damage, '#ff6644');
                        this.lastReefDamage = this.time.now;

                        // Slow down
                        this.player.body.velocity.scale(0.5);
                    }
                } else if (hazard.hazardData.type === 'whirlpool') {
                    // Whirlpool pull effect
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, hazard.hazardData.x, hazard.hazardData.y);
                    const pullForce = hazard.hazardData.pullStrength * (1 - dist / hazard.hazardData.radius);
                    this.player.body.velocity.x += Math.cos(angle) * pullForce;
                    this.player.body.velocity.y += Math.sin(angle) * pullForce;

                    // Spin effect
                    this.player.angle += 0.5;
                }
            }
        });

        // Animate whirlpools
        this.hazards.forEach(hazard => {
            if (hazard.hazardData.type === 'whirlpool') {
                hazard.angle += 0.5;
            }
        });
    }

    updateForts(time) {
        this.forts.forEach(fort => {
            if (fort.destroyed) return;

            const dist = Phaser.Math.Distance.Between(fort.x, fort.y, this.player.x, this.player.y);

            // Fire at player if in range
            if (dist < fort.fortData.range) {
                fort.fireTimer -= this.game.loop.delta;
                if (fort.fireTimer <= 0) {
                    this.fortFire(fort);
                    fort.fireTimer = 3000;
                }
            }

            // Update health bar
            const ratio = fort.hp / fort.maxHp;
            fort.healthBar.setScale(ratio, 1);
        });
    }

    fortFire(fort) {
        const angle = Phaser.Math.Angle.Between(fort.x, fort.y, this.player.x, this.player.y);

        for (let i = 0; i < fort.fortData.cannons; i++) {
            const spread = (i - (fort.fortData.cannons - 1) / 2) * 0.2;
            const bullet = this.enemyBullets.create(fort.x, fort.y, 'cannonball');
            bullet.setTint(0xff6666);
            this.physics.velocityFromRotation(angle + spread, 300, bullet.body.velocity);
            bullet.damage = fort.fortData.damage;

            this.time.delayedCall(1500, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    damageFort(fort, damage) {
        fort.hp -= damage;
        fort.setFillStyle(0xffffff);
        this.time.delayedCall(100, () => {
            if (!fort.destroyed) fort.setFillStyle(0x8b4513);
        });

        if (fort.hp <= 0) {
            this.destroyFort(fort);
        }
    }

    destroyFort(fort) {
        fort.destroyed = true;
        fort.setFillStyle(0x333333);
        fort.healthBar.destroy();
        fort.healthBarBg.destroy();

        // Rewards
        const gold = Phaser.Math.Between(200, 400);
        gameData.gold += gold;
        gameData.statistics.goldEarned += gold;
        this.showFloatingText(fort.x, fort.y, '+' + gold + ' Gold - Fort Destroyed!', '#ffd700', 16);

        // Explosion effect
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                fort.x + Phaser.Math.Between(-30, 30),
                fort.y + Phaser.Math.Between(-30, 30),
                Phaser.Math.Between(4, 12),
                0xff6600
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 800,
                onComplete: () => particle.destroy()
            });
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(400, 400, 'player_ship');
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(100); // Increased drag for quick deceleration
        this.player.setMaxVelocity(150); // Reduced max velocity per feedback
        this.player.setAngle(0);
        this.player.speedLevel = 0; // 0-3 speed levels
        this.player.hp = gameData.ship.armor;
    }

    spawnEnemies() {
        const enemyCount = 5 + gameData.day * 2;
        const types = Object.keys(ENEMY_TYPES);

        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = 200 + Math.random() * (WORLD_WIDTH - 400);
                y = 200 + Math.random() * (WORLD_HEIGHT - 400);
            } while (Phaser.Math.Distance.Between(x, y, 400, 400) < 400);

            // Ghost ships appear after day 5, near Ghost Isle
            let type;
            const nearGhostIsle = Phaser.Math.Distance.Between(x, y, 2100, 1400) < 400;
            if (nearGhostIsle && gameData.day >= 5 && Math.random() < 0.3) {
                type = 'ghost_ship';
            } else {
                const maxTypeIndex = Math.min(types.length - 1, 1 + Math.floor(gameData.day / 3));
                const typeIndex = Math.floor(Math.random() * maxTypeIndex);
                type = types[typeIndex];
            }
            const enemyData = ENEMY_TYPES[type];

            let textureKey;
            if (type === 'merchant') textureKey = 'merchant_ship';
            else if (type.includes('navy')) textureKey = 'navy_ship';
            else if (type === 'ghost_ship') textureKey = 'ghost_ship';
            else textureKey = 'pirate_ship';

            const enemy = this.enemies.create(x, y, textureKey);
            enemy.setTint(enemyData.color);
            if (type === 'ghost_ship') enemy.setAlpha(0.7); // Ghostly transparency
            enemy.enemyType = type;
            enemy.hp = enemyData.hp;
            enemy.maxHp = enemyData.hp;
            enemy.speed = enemyData.speed;
            enemy.damage = enemyData.damage;
            enemy.goldMin = enemyData.goldMin;
            enemy.goldMax = enemyData.goldMax;
            enemy.lootSlots = enemyData.lootSlots;
            enemy.angle = Math.random() * 360;
            enemy.state = 'patrol';
            enemy.patrolTarget = new Phaser.Math.Vector2(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT);
            enemy.fireTimer = 0;

            // Health bar
            enemy.healthBarBg = this.add.rectangle(0, 0, 30, 4, 0x440000);
            enemy.healthBar = this.add.rectangle(0, 0, 30, 4, 0x44aa44);
        }
    }

    updateEnemyHealthBars() {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            if (enemy.healthBar && enemy.healthBarBg) {
                enemy.healthBarBg.x = enemy.x;
                enemy.healthBarBg.y = enemy.y - 20;
                enemy.healthBar.x = enemy.x;
                enemy.healthBar.y = enemy.y - 20;
                const ratio = enemy.hp / enemy.maxHp;
                enemy.healthBar.setScale(ratio, 1);
                enemy.healthBar.setFillStyle(ratio > 0.5 ? 0x44aa44 : (ratio > 0.25 ? 0xaaaa44 : 0xaa4444));
            }
        });
    }

    createUI() {
        // UI container (fixed to camera)
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0);

        // Top bar background
        this.uiContainer.add(this.add.rectangle(GAME_WIDTH / 2, 20, GAME_WIDTH, 40, COLORS.UI_BG, 0.8));

        // Armor bar
        this.uiContainer.add(this.add.text(10, 10, 'Armor:', { fontSize: '14px', color: '#ffffff' }));
        this.armorBarBg = this.add.rectangle(120, 15, 150, 12, 0x440000);
        this.armorBar = this.add.rectangle(120, 15, 150, 12, 0x44aa44);
        this.armorBar.setOrigin(0, 0.5);
        this.armorBarBg.setOrigin(0, 0.5);
        this.uiContainer.add([this.armorBarBg, this.armorBar]);

        // Day timer
        this.dayText = this.add.text(GAME_WIDTH - 100, 5, 'Day ' + gameData.day, { fontSize: '14px', color: '#ffd700' });
        this.timeText = this.add.text(GAME_WIDTH - 100, 22, 'Time: ' + this.formatTime(gameData.dayTimeRemaining), { fontSize: '12px', color: '#ffffff' });
        this.uiContainer.add([this.dayText, this.timeText]);

        // Gold display
        this.goldText = this.add.text(300, 10, 'Gold: ' + gameData.gold, { fontSize: '14px', color: '#ffd700' });
        this.uiContainer.add(this.goldText);

        // Cargo display
        this.cargoText = this.add.text(450, 10, `Cargo: ${gameData.cargo.length}/${gameData.cargoMax}`, { fontSize: '14px', color: '#aaaaaa' });
        this.uiContainer.add(this.cargoText);

        // Neptune's Eye pieces
        this.piecesText = this.add.text(600, 10, `Eye Pieces: ${gameData.neptunesPieces.length}/5`, { fontSize: '14px', color: '#aa88ff' });
        this.uiContainer.add(this.piecesText);

        // Weather display
        const weatherColors = { clear: '#ffff44', cloudy: '#aaaaaa', rainy: '#6688cc', stormy: '#ff4444' };
        this.weatherText = this.add.text(750, 10, 'Weather: ' + gameData.weather.type.toUpperCase(), {
            fontSize: '12px',
            color: weatherColors[gameData.weather.type]
        });
        this.uiContainer.add(this.weatherText);

        // Morale and ship condition (second row)
        this.uiContainer.add(this.add.rectangle(GAME_WIDTH / 2, 45, GAME_WIDTH, 20, COLORS.UI_BG, 0.6));

        const moraleLevel = getMoraleLevel();
        const moraleColors = { high: '#44ff44', normal: '#ffffff', low: '#ffaa44', critical: '#ff4444' };
        this.moraleText = this.add.text(10, 40, `Morale: ${gameData.crew.morale}% (${moraleLevel})`, {
            fontSize: '11px',
            color: moraleColors[moraleLevel]
        });
        this.uiContainer.add(this.moraleText);

        this.conditionText = this.add.text(180, 40, `Ship Condition: ${gameData.shipCondition}%`, {
            fontSize: '11px',
            color: gameData.shipCondition > 50 ? '#44ff44' : '#ff4444'
        });
        this.uiContainer.add(this.conditionText);

        // Crew size
        this.crewText = this.add.text(380, 40, `Crew: ${gameData.crew.size}/${gameData.crew.maxSize}`, {
            fontSize: '11px',
            color: '#aaaaaa'
        });
        this.uiContainer.add(this.crewText);

        // Quest tracker (bottom left)
        this.questTrackerText = this.add.text(10, GAME_HEIGHT - 80, '', { fontSize: '11px', color: '#aaffaa' });
        this.uiContainer.add(this.questTrackerText);
        this.updateQuestTracker();

        // Bottom bar
        this.uiContainer.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH, 40, COLORS.UI_BG, 0.8));
        this.speedText = this.add.text(10, GAME_HEIGHT - 30, 'Speed: STOP', { fontSize: '14px', color: '#ffffff' });
        this.uiContainer.add(this.speedText);

        // Instructions
        this.uiContainer.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'W/S: Speed | A/D: Turn | Space: Fire | ESC: Return', { fontSize: '12px', color: '#888888' }).setOrigin(0.5));

        // Minimap
        this.createMinimap();
    }

    createMinimap() {
        const mapSize = 100;
        const mapX = GAME_WIDTH - mapSize - 10;
        const mapY = 50;
        const scale = mapSize / WORLD_WIDTH;

        // Minimap container
        this.minimapContainer = this.add.container(mapX, mapY).setScrollFactor(0);

        // Background
        const bg = this.add.rectangle(0, 0, mapSize, mapSize, 0x1a3a5c, 0.8);
        bg.setStrokeStyle(2, 0x4a4a6a);
        this.minimapContainer.add(bg);

        // Islands on minimap
        ISLANDS.forEach(island => {
            const ix = (island.x * scale) - mapSize/2;
            const iy = (island.y * scale) - mapSize/2;
            const ir = Math.max(3, island.radius * scale);
            const dot = this.add.circle(ix, iy, ir, 0xd4b896);
            this.minimapContainer.add(dot);
        });

        // Player dot
        this.minimapPlayer = this.add.circle(0, 0, 3, 0x44ff44);
        this.minimapContainer.add(this.minimapPlayer);

        // Enemy dots array
        this.minimapEnemies = [];
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    tickDay() {
        gameData.dayTimeRemaining--;
        this.timeText.setText('Time: ' + this.formatTime(gameData.dayTimeRemaining));

        // Day/night tinting
        this.updateDayNightTint();

        if (gameData.dayTimeRemaining <= 0) {
            this.endDay();
        }
    }

    updateDayNightTint() {
        // Time of day affects world tint
        const timeRatio = gameData.dayTimeRemaining / 180;
        let tint;

        if (timeRatio > 0.7) {
            // Morning - bright
            tint = 0xffffff;
        } else if (timeRatio > 0.3) {
            // Midday - golden
            tint = 0xffffee;
        } else if (timeRatio > 0.1) {
            // Evening - orange/red
            const t = (timeRatio - 0.1) / 0.2;
            const r = Math.floor(255);
            const g = Math.floor(200 + t * 55);
            const b = Math.floor(150 + t * 105);
            tint = (r << 16) | (g << 8) | b;
        } else {
            // Night approaching - blue
            tint = 0xaabbdd;
        }

        this.cameras.main.setBackgroundColor(
            Phaser.Display.Color.ValueToColor(tint).darken(30).color
        );
    }

    endDay() {
        gameData.day++;
        gameData.statistics.daysPlayed++;
        saveGame(); // Auto-save at end of each day
        this.scene.start('BaseScene');
    }

    update(time, delta) {
        this.handleInput(time, delta);
        this.updateEnemies(time);
        this.updateEnemyHealthBars();
        this.updateForts(time);
        this.updateHazards();
        this.checkBulletFortCollision();
        this.updateUI();
        this.checkIslandProximity();
        this.updateMinimap();
        this.spawnWake();
        this.trackDistanceSailed();
        checkAchievements(this);
    }

    trackDistanceSailed() {
        const speed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
        if (speed > 10) {
            gameData.statistics.distanceSailed += speed * 0.01;
        }
    }

    checkBulletFortCollision() {
        this.playerBullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            this.forts.forEach(fort => {
                if (fort.destroyed) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, fort.x, fort.y);
                if (dist < 30) {
                    this.damageFort(fort, bullet.damage);
                    this.spawnWaterSplash(bullet.x, bullet.y);
                    bullet.destroy();
                }
            });
        });
    }

    spawnWaterSplash(x, y) {
        for (let i = 0; i < 5; i++) {
            const splash = this.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(2, 6),
                0x4a8aaa,
                0.8
            );
            this.tweens.add({
                targets: splash,
                y: splash.y - 10,
                alpha: 0,
                scale: 1.5,
                duration: 400,
                onComplete: () => splash.destroy()
            });
        }
    }

    updateMinimap() {
        const mapSize = 100;
        const scale = mapSize / WORLD_WIDTH;

        // Update player position on minimap
        this.minimapPlayer.x = (this.player.x * scale) - mapSize/2;
        this.minimapPlayer.y = (this.player.y * scale) - mapSize/2;

        // Clear old enemy dots
        this.minimapEnemies.forEach(dot => dot.destroy());
        this.minimapEnemies = [];

        // Add enemy dots
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const ex = (enemy.x * scale) - mapSize/2;
            const ey = (enemy.y * scale) - mapSize/2;
            const color = enemy.enemyType === 'merchant' ? 0xddaa44 : (enemy.enemyType.includes('navy') ? 0x4444ff : 0xff4444);
            const dot = this.add.circle(ex, ey, 2, color).setScrollFactor(0);
            this.minimapContainer.add(dot);
            this.minimapEnemies.push(dot);
        });

        // Add fort dots
        this.forts.forEach(fort => {
            if (fort.destroyed) return;
            const fx = (fort.x * scale) - mapSize/2;
            const fy = (fort.y * scale) - mapSize/2;
            const dot = this.add.rectangle(fx, fy, 4, 4, 0x8b4513).setScrollFactor(0);
            this.minimapContainer.add(dot);
            this.minimapEnemies.push(dot);
        });
    }

    spawnWake() {
        // Spawn wake particles behind ship when moving
        const speed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
        if (speed > 20 && Math.random() < 0.3) {
            const angle = Phaser.Math.DegToRad(this.player.angle + 180);
            const wake = this.add.circle(
                this.player.x + Math.cos(angle) * 20 + Phaser.Math.Between(-5, 5),
                this.player.y + Math.sin(angle) * 20 + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(2, 5),
                0x4a7a9c,
                0.6
            );
            this.tweens.add({
                targets: wake,
                alpha: 0,
                scale: 2,
                duration: 1000,
                onComplete: () => wake.destroy()
            });
        }
    }

    handleInput(time, delta) {
        // Speed control - faster acceleration per feedback
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.speedLevel = Math.min(3, this.player.speedLevel + 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.player.speedLevel = Math.max(0, this.player.speedLevel - 1);
        }

        // Turning
        const turnRate = 150; // Faster turn rate
        if (this.cursors.left.isDown) {
            this.player.angle -= turnRate * delta / 1000;
        }
        if (this.cursors.right.isDown) {
            this.player.angle += turnRate * delta / 1000;
        }

        // Apply weather and morale modifiers
        const weatherMod = WEATHER_TYPES[gameData.weather.type].speedMod;
        const moraleMod = MORALE_EFFECTS[getMoraleLevel()].speedBonus;
        const conditionMod = 0.5 + (gameData.shipCondition / 200); // 50-100% based on condition

        // Apply velocity based on speed level - much faster acceleration
        const maxSpeed = 150 * gameData.ship.speed * weatherMod * moraleMod * conditionMod;
        const targetSpeed = (this.player.speedLevel / 3) * maxSpeed;
        const acceleration = 300; // Much higher acceleration per feedback

        const angle = Phaser.Math.DegToRad(this.player.angle);
        const currentSpeed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);

        if (currentSpeed < targetSpeed) {
            this.physics.velocityFromRotation(angle, Math.min(targetSpeed, currentSpeed + acceleration * delta / 1000), this.player.body.velocity);
        } else if (currentSpeed > targetSpeed + 10) {
            // Faster deceleration
            this.player.body.velocity.scale(0.95);
        }

        // Fire cannons
        if (this.cursors.fire.isDown && time > this.lastFired + (2000 / gameData.ship.reload)) {
            this.fireCannons();
            this.lastFired = time;
        }

        // Return to base
        if (Phaser.Input.Keyboard.JustDown(this.cursors.esc)) {
            this.endDay();
        }
    }

    fireCannons() {
        const angle = Phaser.Math.DegToRad(this.player.angle);
        const leftAngle = angle - Math.PI / 2;
        const rightAngle = angle + Math.PI / 2;
        const spread = 0.3;
        const bulletCount = 3 + Math.floor(gameData.ship.firepower / 3);

        // Fire from both sides
        for (let side = -1; side <= 1; side += 2) {
            const baseAngle = side < 0 ? leftAngle : rightAngle;

            // Spawn cannon smoke
            this.spawnCannonSmoke(
                this.player.x + Math.cos(baseAngle) * 15,
                this.player.y + Math.sin(baseAngle) * 15
            );

            for (let i = 0; i < bulletCount; i++) {
                const bulletAngle = baseAngle + (i - (bulletCount - 1) / 2) * spread / bulletCount;
                const bullet = this.playerBullets.create(this.player.x, this.player.y, 'cannonball');
                this.physics.velocityFromRotation(bulletAngle, 400, bullet.body.velocity);
                bullet.damage = 10 + gameData.ship.firepower * 5;
                bullet.setDepth(1);

                // Destroy after 0.75 seconds
                this.time.delayedCall(750, () => {
                    if (bullet.active) bullet.destroy();
                });
            }
        }
    }

    spawnCannonSmoke(x, y) {
        for (let i = 0; i < 5; i++) {
            const smoke = this.add.circle(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(4, 10),
                0x888888,
                0.7
            );
            this.tweens.add({
                targets: smoke,
                alpha: 0,
                scale: 2,
                y: smoke.y - 15,
                duration: 600,
                onComplete: () => smoke.destroy()
            });
        }
    }

    showFloatingText(x, y, text, color = '#ffffff', size = 14) {
        const floatText = this.add.text(x, y, text, {
            fontSize: size + 'px',
            color: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => floatText.destroy()
        });
    }

    updateEnemies(time) {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // State machine
            if (distToPlayer < 300 && enemy.enemyType !== 'merchant') {
                enemy.state = 'attack';
            } else if (distToPlayer < 200 && enemy.enemyType === 'merchant') {
                enemy.state = 'flee';
            } else {
                enemy.state = 'patrol';
            }

            // Movement
            let targetX, targetY;
            if (enemy.state === 'attack') {
                targetX = this.player.x;
                targetY = this.player.y;
            } else if (enemy.state === 'flee') {
                targetX = enemy.x + (enemy.x - this.player.x);
                targetY = enemy.y + (enemy.y - this.player.y);
            } else {
                if (Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y) < 50) {
                    enemy.patrolTarget.set(200 + Math.random() * (WORLD_WIDTH - 400), 200 + Math.random() * (WORLD_HEIGHT - 400));
                }
                targetX = enemy.patrolTarget.x;
                targetY = enemy.patrolTarget.y;
            }

            // Turn toward target
            const targetAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY));
            const angleDiff = Phaser.Math.Angle.Wrap(Phaser.Math.DegToRad(targetAngle - enemy.angle));
            enemy.angle += Phaser.Math.Clamp(angleDiff * 100, -90, 90) * (this.game.loop.delta / 1000);

            // Move forward
            const speed = enemy.state === 'flee' ? enemy.speed * 1.2 : enemy.speed;
            this.physics.velocityFromRotation(Phaser.Math.DegToRad(enemy.angle), speed, enemy.body.velocity);

            // Fire at player if attacking
            if (enemy.state === 'attack' && distToPlayer < 250) {
                enemy.fireTimer -= this.game.loop.delta;
                if (enemy.fireTimer <= 0) {
                    this.enemyFire(enemy);
                    enemy.fireTimer = 2000;
                }
            }
        });
    }

    enemyFire(enemy) {
        const angle = Phaser.Math.DegToRad(enemy.angle);
        const leftAngle = angle - Math.PI / 2;
        const rightAngle = angle + Math.PI / 2;

        [leftAngle, rightAngle].forEach(fireAngle => {
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'cannonball');
            bullet.setTint(0xff4444);
            this.physics.velocityFromRotation(fireAngle, 300, bullet.body.velocity);
            bullet.damage = enemy.damage;

            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        });
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy();

        enemy.hp -= bullet.damage;

        // Flash effect
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.setTint(ENEMY_TYPES[enemy.enemyType].color);
        });

        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    destroyEnemy(enemy) {
        // Clean up health bar
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();

        // Show floating text for kill
        this.showFloatingText(enemy.x, enemy.y - 20, ENEMY_TYPES[enemy.enemyType].name + ' Destroyed!', '#ff4444');

        // Drop Neptune's Eye piece (rare chance, or guaranteed from certain enemies)
        if (gameData.neptunesPieces.length < 5) {
            let pieceChance = 0;
            if (enemy.enemyType === 'pirate_captain' && !gameData.neptunesPieces.includes(2)) {
                pieceChance = 0.5; // Piece 2 from Pirate Captain
            } else if (enemy.enemyType === 'ghost_ship' && !gameData.neptunesPieces.includes(4)) {
                pieceChance = 0.3; // Piece 4 from Ghost Ship
            } else if (enemy.enemyType === 'navy_frigate' && !gameData.neptunesPieces.includes(3)) {
                pieceChance = 0.2; // Piece 3 from Navy Frigate
            }

            if (Math.random() < pieceChance) {
                const pieceNum = gameData.neptunesPieces.length + 1;
                gameData.neptunesPieces.push(pieceNum);
                this.showFloatingText(enemy.x, enemy.y - 40, "NEPTUNE'S EYE PIECE " + pieceNum + "!", '#ffd700', 24);
            }
        }

        // Drop gold
        const goldAmount = Phaser.Math.Between(enemy.goldMin, enemy.goldMax);
        const gold = this.goldPickups.create(enemy.x, enemy.y, 'gold_coin');
        gold.value = goldAmount;
        this.showFloatingText(enemy.x, enemy.y, '+' + goldAmount + ' Gold', '#ffd700');

        // Drop loot
        const lootTypes = Object.keys(CARGO_ITEMS);
        for (let i = 0; i < enemy.lootSlots; i++) {
            if (Math.random() < 0.5) {
                const loot = this.loot.create(
                    enemy.x + Phaser.Math.Between(-30, 30),
                    enemy.y + Phaser.Math.Between(-30, 30),
                    'loot'
                );
                loot.itemType = lootTypes[Math.floor(Math.random() * lootTypes.length)];
            }
        }

        // Explosion particles
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(
                enemy.x + Phaser.Math.Between(-20, 20),
                enemy.y + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(3, 8),
                0xff6600
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        // Update stats
        gameData.statistics.shipsDestroyed++;

        // Morale boost from victory
        gameData.crew.morale = Math.min(100, gameData.crew.morale + 3);

        // Check quests
        gameData.activeQuests.forEach(quest => {
            if (quest.target === enemy.enemyType || (quest.target === 'pirate' && enemy.enemyType.includes('pirate'))) {
                quest.progress++;
            }
        });

        enemy.destroy();
    }

    bulletHitPlayer(bullet, player) {
        bullet.destroy();

        this.player.hp -= bullet.damage;
        gameData.ship.armor = Math.max(0, this.player.hp);

        // Morale decreases when hit
        gameData.crew.morale = Math.max(0, gameData.crew.morale - 1);

        // Ship condition decreases slightly
        gameData.shipCondition = Math.max(0, gameData.shipCondition - 0.5);

        // Flash effect
        this.player.setTint(0xff4444);
        this.time.delayedCall(100, () => {
            if (this.player.active) this.player.setTint(0xffffff);
        });

        // Camera shake
        this.cameras.main.shake(100, 0.01);

        if (this.player.hp <= 0) {
            this.playerDestroyed();
        }
    }

    playerDestroyed() {
        // Lose 25% of cargo
        const loseCount = Math.ceil(gameData.cargo.length * 0.25);
        for (let i = 0; i < loseCount; i++) {
            if (gameData.cargo.length > 0) {
                gameData.cargo.pop();
            }
        }

        gameData.ship.armor = gameData.ship.maxArmor;
        this.endDay();
    }

    collectLoot(player, loot) {
        if (gameData.cargo.length < gameData.cargoMax) {
            const itemInfo = CARGO_ITEMS[loot.itemType];

            // Check if it's a treasure map
            if (itemInfo && itemInfo.special === 'treasure') {
                loot.destroy();
                this.scene.start('TreasureScene');
                return;
            }

            gameData.cargo.push(loot.itemType);
            loot.destroy();
        }
    }

    collectGold(player, gold) {
        gameData.gold += gold.value;
        gameData.statistics.goldEarned += gold.value;
        gold.destroy();
    }

    checkIslandProximity() {
        this.islands.forEach(island => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, island.data.x, island.data.y);
            if (dist < island.data.radius + 50) {
                // Near island - could implement docking/trading here
                island.marker.setFillStyle(0x44ff44);
            } else {
                island.marker.setFillStyle(0xffd700);
            }
        });
    }

    updateUI() {
        // Update armor bar
        const armorPercent = gameData.ship.armor / gameData.ship.maxArmor;
        this.armorBar.setScale(armorPercent, 1);
        this.armorBar.setFillStyle(armorPercent > 0.5 ? 0x44aa44 : (armorPercent > 0.25 ? 0xaaaa44 : 0xaa4444));

        // Update gold
        this.goldText.setText('Gold: ' + gameData.gold);

        // Update cargo
        this.cargoText.setText(`Cargo: ${gameData.cargo.length}/${gameData.cargoMax}`);

        // Update pieces
        this.piecesText.setText(`Eye Pieces: ${gameData.neptunesPieces.length}/5`);

        // Update speed
        const speedNames = ['STOP', 'SLOW', 'HALF', 'FULL'];
        this.speedText.setText('Speed: ' + speedNames[this.player.speedLevel]);

        // Update morale
        const moraleLevel = getMoraleLevel();
        const moraleColors = { high: '#44ff44', normal: '#ffffff', low: '#ffaa44', critical: '#ff4444' };
        this.moraleText.setText(`Morale: ${Math.floor(gameData.crew.morale)}% (${moraleLevel})`);
        this.moraleText.setStyle({ color: moraleColors[moraleLevel] });

        // Update ship condition
        this.conditionText.setText(`Ship Condition: ${Math.floor(gameData.shipCondition)}%`);
        this.conditionText.setStyle({ color: gameData.shipCondition > 50 ? '#44ff44' : '#ff4444' });

        // Update crew
        this.crewText.setText(`Crew: ${gameData.crew.size}/${gameData.crew.maxSize}`);
    }

    updateQuestTracker() {
        if (gameData.activeQuests.length === 0) {
            this.questTrackerText.setText('No active quests');
            return;
        }

        let text = 'QUESTS:\n';
        gameData.activeQuests.slice(0, 3).forEach(quest => {
            const progress = quest.progress || 0;
            const count = quest.count || 1;
            text += `${quest.name}: ${progress}/${count}\n`;
        });
        this.questTrackerText.setText(text);
    }
}

// Kraken Boss Fight Scene
class KrakenScene extends Phaser.Scene {
    constructor() {
        super('KrakenScene');
    }

    create() {
        // Arena background - circular water
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a2a4c);

        // Arena border (instant damage zone)
        this.arenaBorder = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 280, 0x1a3a5c);
        this.arenaBorder.setStrokeStyle(4, 0xff4444);

        // Create Kraken body
        this.krakenBody = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 60, 0x4a2a4a);
        this.krakenBody.hp = 500;
        this.krakenBody.maxHp = 500;
        this.krakenBody.vulnerable = false;

        // Create tentacles
        this.tentacles = [];
        const tentacleAngles = [0, Math.PI/2, Math.PI, Math.PI * 1.5];
        const tentacleTypes = ['swipe', 'slam', 'grab', 'ink'];

        tentacleAngles.forEach((angle, i) => {
            const x = GAME_WIDTH / 2 + Math.cos(angle) * 120;
            const y = GAME_HEIGHT / 2 + Math.sin(angle) * 120;
            const tent = this.add.ellipse(x, y, 40, 80, 0x6a3a6a);
            tent.hp = 200;
            tent.maxHp = 200;
            tent.attackType = tentacleTypes[i];
            tent.angle = Phaser.Math.RadToDeg(angle) + 90;
            tent.attackTimer = 2000 + i * 500;
            this.tentacles.push(tent);
        });

        // Player ship
        this.player = this.physics.add.sprite(200, GAME_HEIGHT / 2, 'player_ship');
        this.player.setCollideWorldBounds(true);
        this.player.hp = gameData.ship.armor;

        // Player bullets
        this.playerBullets = this.physics.add.group();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // UI
        this.createUI();

        // Phase tracking
        this.phase = 1; // 1 = tentacles, 2 = body
        this.lastFired = 0;
    }

    createUI() {
        // Boss health bar
        this.add.rectangle(GAME_WIDTH / 2, 20, 400, 20, 0x440044, 0.8);
        this.bossHealthBar = this.add.rectangle(GAME_WIDTH / 2, 20, 400, 16, 0xaa44aa);

        this.phaseText = this.add.text(GAME_WIDTH / 2, 45, 'PHASE 1: Destroy the Tentacles!', {
            fontSize: '16px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Player health
        this.add.text(10, GAME_HEIGHT - 30, 'Armor:', { fontSize: '14px', color: '#ffffff' });
        this.playerHealthBar = this.add.rectangle(100, GAME_HEIGHT - 24, 150, 12, 0x44aa44);
    }

    update(time, delta) {
        this.handleInput(time);
        this.updateTentacles(time);
        this.checkCollisions();
        this.updateUI();
    }

    handleInput(time) {
        // Movement
        const speed = 150 * gameData.ship.speed;
        this.player.body.velocity.set(0);

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(Phaser.Math.DegToRad(this.player.angle), speed, this.player.body.velocity);
        }
        if (this.cursors.down.isDown) {
            this.physics.velocityFromRotation(Phaser.Math.DegToRad(this.player.angle), -speed * 0.5, this.player.body.velocity);
        }
        if (this.cursors.left.isDown) {
            this.player.angle -= 3;
        }
        if (this.cursors.right.isDown) {
            this.player.angle += 3;
        }

        // Fire
        if (this.cursors.fire.isDown && time > this.lastFired + (2000 / gameData.ship.reload)) {
            this.fireCannons();
            this.lastFired = time;
        }
    }

    fireCannons() {
        const angle = Phaser.Math.DegToRad(this.player.angle);
        const leftAngle = angle - Math.PI / 2;
        const rightAngle = angle + Math.PI / 2;

        [leftAngle, rightAngle].forEach(fireAngle => {
            const bullet = this.playerBullets.create(this.player.x, this.player.y, 'cannonball');
            this.physics.velocityFromRotation(fireAngle, 400, bullet.body.velocity);
            bullet.damage = 10 + gameData.ship.firepower * 5;

            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        });
    }

    updateTentacles(time) {
        this.tentacles.forEach(tent => {
            if (tent.hp <= 0) return;

            tent.attackTimer -= this.game.loop.delta;
            if (tent.attackTimer <= 0) {
                this.tentacleAttack(tent);
                tent.attackTimer = 3000;
            }
        });

        // Check if all tentacles dead
        const aliveTentacles = this.tentacles.filter(t => t.hp > 0).length;
        if (aliveTentacles === 0 && this.phase === 1) {
            this.phase = 2;
            this.krakenBody.vulnerable = true;
            this.phaseText.setText('PHASE 2: Destroy the Body!');
            this.krakenBody.setFillStyle(0x8a4a8a); // Highlight vulnerable
        }
    }

    tentacleAttack(tent) {
        // Visual attack indicator
        const indicator = this.add.circle(tent.x, tent.y, 50, 0xff4444, 0.3);
        this.tweens.add({
            targets: indicator,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => {
                indicator.destroy();
                // Check if player is in range
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tent.x, tent.y);
                if (dist < 80) {
                    this.damagePlayer(tent.attackType === 'grab' ? 25 : (tent.attackType === 'ink' ? 10 : 20));
                }
            }
        });
    }

    checkCollisions() {
        // Bullets hitting tentacles
        this.playerBullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            this.tentacles.forEach(tent => {
                if (tent.hp <= 0) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, tent.x, tent.y);
                if (dist < 40) {
                    tent.hp -= bullet.damage;
                    bullet.destroy();
                    tent.setFillStyle(0xffffff);
                    this.time.delayedCall(100, () => {
                        if (tent.hp > 0) tent.setFillStyle(0x6a3a6a);
                        else tent.setFillStyle(0x333333);
                    });
                }
            });

            // Bullets hitting body (only if vulnerable)
            if (this.krakenBody.vulnerable) {
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.krakenBody.x, this.krakenBody.y);
                if (dist < 60) {
                    this.krakenBody.hp -= bullet.damage;
                    bullet.destroy();
                    this.krakenBody.setFillStyle(0xffffff);
                    this.time.delayedCall(100, () => {
                        this.krakenBody.setFillStyle(0x8a4a8a);
                    });

                    if (this.krakenBody.hp <= 0) {
                        this.victory();
                    }
                }
            }
        });

        // Player touching arena edge
        const distFromCenter = Phaser.Math.Distance.Between(this.player.x, this.player.y, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        if (distFromCenter > 260) {
            this.damagePlayer(2);
            // Push back
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, GAME_WIDTH / 2, GAME_HEIGHT / 2);
            this.player.x += Math.cos(angle) * 5;
            this.player.y += Math.sin(angle) * 5;
        }
    }

    damagePlayer(amount) {
        this.player.hp -= amount;
        gameData.ship.armor = Math.max(0, this.player.hp);

        this.player.setTint(0xff4444);
        this.time.delayedCall(100, () => {
            this.player.setTint(0xffffff);
        });

        if (this.player.hp <= 0) {
            this.defeat();
        }
    }

    updateUI() {
        // Boss health
        let totalHp, maxHp;
        if (this.phase === 1) {
            totalHp = this.tentacles.reduce((sum, t) => sum + Math.max(0, t.hp), 0);
            maxHp = 800; // 4 * 200
        } else {
            totalHp = Math.max(0, this.krakenBody.hp);
            maxHp = 500;
        }
        const ratio = totalHp / maxHp;
        this.bossHealthBar.setScale(ratio, 1);

        // Player health
        const playerRatio = this.player.hp / gameData.ship.maxArmor;
        this.playerHealthBar.setScale(playerRatio, 1);
    }

    victory() {
        gameData.gold += 2000;
        this.scene.start('VictoryScene');
    }

    defeat() {
        this.scene.start('GameOverScene');
    }
}

// Treasure Hunting Mini-Game Scene
class TreasureScene extends Phaser.Scene {
    constructor() {
        super('TreasureScene');
    }

    init(data) {
        this.attempts = 3;
        this.treasureX = Phaser.Math.Between(200, GAME_WIDTH - 200);
        this.treasureY = Phaser.Math.Between(200, GAME_HEIGHT - 200);
        this.found = false;
    }

    create() {
        // Island background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xd4b896);

        // Grass patches
        for (let i = 0; i < 20; i++) {
            this.add.circle(
                Phaser.Math.Between(50, GAME_WIDTH - 50),
                Phaser.Math.Between(50, GAME_HEIGHT - 50),
                Phaser.Math.Between(20, 50),
                0x4a8c4a,
                0.7
            );
        }

        // Palm trees
        for (let i = 0; i < 8; i++) {
            const tx = Phaser.Math.Between(50, GAME_WIDTH - 50);
            const ty = Phaser.Math.Between(50, GAME_HEIGHT - 100);
            this.add.rectangle(tx, ty + 20, 8, 40, 0x8b4513);
            this.add.circle(tx, ty - 10, 25, 0x228b22);
        }

        // UI
        this.add.rectangle(GAME_WIDTH / 2, 30, 300, 50, 0x1a1a2e, 0.8);
        this.add.text(GAME_WIDTH / 2, 20, 'TREASURE HUNT', {
            fontSize: '24px',
            color: '#ffd700'
        }).setOrigin(0.5);
        this.attemptsText = this.add.text(GAME_WIDTH / 2, 42, `Attempts: ${this.attempts}`, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.feedbackText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Click to dig!', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Click to dig
        this.input.on('pointerdown', (pointer) => {
            if (!this.found && this.attempts > 0) {
                this.dig(pointer.x, pointer.y);
            }
        });
    }

    dig(x, y) {
        const dist = Phaser.Math.Distance.Between(x, y, this.treasureX, this.treasureY);
        this.attempts--;
        this.attemptsText.setText(`Attempts: ${this.attempts}`);

        // Dig hole visual
        this.add.circle(x, y, 15, 0x8b4513);
        this.add.circle(x, y, 10, 0x654321);

        // Distance feedback
        let feedback;
        if (dist < 25 || (this.attempts === 0 && dist < 50)) {
            // Found it!
            this.foundTreasure();
            return;
        } else if (dist < 50) {
            feedback = 'BURNING!';
            this.feedbackText.setColor('#ff4444');
        } else if (dist < 100) {
            feedback = 'Hot!';
            this.feedbackText.setColor('#ff8844');
        } else if (dist < 150) {
            feedback = 'Warm';
            this.feedbackText.setColor('#ffaa44');
        } else if (dist < 200) {
            feedback = 'Cold';
            this.feedbackText.setColor('#4488ff');
        } else {
            feedback = 'Freezing Cold';
            this.feedbackText.setColor('#4444ff');
        }

        this.feedbackText.setText(feedback);

        if (this.attempts === 0 && !this.found) {
            this.failedSearch();
        }
    }

    foundTreasure() {
        this.found = true;
        this.feedbackText.setText('TREASURE FOUND!');
        this.feedbackText.setColor('#ffd700');

        // Show treasure
        this.add.circle(this.treasureX, this.treasureY, 20, 0xffd700);
        this.add.text(this.treasureX, this.treasureY, 'X', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);

        // Calculate reward based on remaining attempts
        const baseGold = 100 + (this.attempts * 50);
        gameData.gold += baseGold;

        // Add loot
        const lootTypes = Object.keys(CARGO_ITEMS);
        const rareIndex = Math.min(this.attempts + 3, lootTypes.length - 1);
        if (gameData.cargo.length < gameData.cargoMax) {
            gameData.cargo.push(lootTypes[rareIndex]);
        }

        this.time.delayedCall(2000, () => {
            this.scene.start('SailingScene');
        });
    }

    failedSearch() {
        this.feedbackText.setText('No treasure found... 50 gold consolation');
        this.feedbackText.setColor('#888888');
        gameData.gold += 50;

        // Show where treasure was
        this.add.circle(this.treasureX, this.treasureY, 20, 0xffd700, 0.5);
        this.add.text(this.treasureX, this.treasureY, 'X', {
            fontSize: '24px',
            color: '#000000',
            alpha: 0.5
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('SailingScene');
        });
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

        this.add.text(GAME_WIDTH / 2, 100, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 180, 'Your ship has been destroyed!', {
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Statistics
        this.add.text(GAME_WIDTH / 2, 260, 'FINAL STATISTICS', {
            fontSize: '24px',
            color: '#ffd700'
        }).setOrigin(0.5);

        const stats = [
            `Days Survived: ${gameData.statistics.daysPlayed}`,
            `Ships Destroyed: ${gameData.statistics.shipsDestroyed}`,
            `Total Gold Earned: ${gameData.statistics.goldEarned}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(GAME_WIDTH / 2, 310 + i * 30, stat, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);
        });

        // Restart button
        const btn = this.add.rectangle(GAME_WIDTH / 2, 480, 200, 50, 0x4a6a4a)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x6a8a6a))
            .on('pointerout', () => btn.setFillStyle(0x4a6a4a))
            .on('pointerdown', () => this.restart());

        this.add.text(GAME_WIDTH / 2, 480, 'TRY AGAIN', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    restart() {
        // Reset game data
        gameData.day = 1;
        gameData.gold = 100;
        gameData.dayTimeRemaining = 180;
        gameData.ship = {
            type: 'balanced',
            armor: 100,
            maxArmor: 100,
            speed: 1,
            reload: 1,
            capacity: 10,
            firepower: 1
        };
        gameData.cargo = [];
        gameData.cargoMax = 10;
        gameData.activeQuests = [];
        gameData.weapons = ['cannons'];
        gameData.statistics = { shipsDestroyed: 0, goldEarned: 0, daysPlayed: 0 };

        this.scene.start('TitleScene');
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

        this.add.text(GAME_WIDTH / 2, 80, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 140, 'You defeated the Kraken!', {
            fontSize: '24px',
            color: '#44ff44'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 200, "Neptune's Eye is yours!", {
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Rating
        const rating = this.calculateRating();
        this.add.text(GAME_WIDTH / 2, 280, `Rating: ${rating}`, {
            fontSize: '36px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Statistics
        const stats = [
            `Days to Victory: ${gameData.statistics.daysPlayed}`,
            `Ships Destroyed: ${gameData.statistics.shipsDestroyed}`,
            `Total Gold Earned: ${gameData.statistics.goldEarned}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(GAME_WIDTH / 2, 350 + i * 30, stat, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);
        });

        // Play again button
        const btn = this.add.rectangle(GAME_WIDTH / 2, 500, 200, 50, 0x4a6a4a)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('TitleScene'));

        this.add.text(GAME_WIDTH / 2, 500, 'PLAY AGAIN', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    calculateRating() {
        const days = gameData.statistics.daysPlayed;
        if (days <= 15) return 'S - LEGENDARY';
        if (days <= 20) return 'A - EXCELLENT';
        if (days <= 25) return 'B - GOOD';
        if (days <= 30) return 'C - AVERAGE';
        return 'D - SLOW';
    }
}

// Phaser config
const config = {
    type: Phaser.CANVAS,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.WATER,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, TitleScene, BaseScene, SailingScene, TreasureScene, KrakenScene, GameOverScene, VictoryScene]
};

// Save/Load functions
function saveGame() {
    const saveData = {
        day: gameData.day,
        gold: gameData.gold,
        ship: { ...gameData.ship },
        cargo: [...gameData.cargo],
        cargoMax: gameData.cargoMax,
        weapons: [...gameData.weapons],
        neptunesPieces: [...gameData.neptunesPieces],
        statistics: { ...gameData.statistics },
        activeQuests: gameData.activeQuests.map(q => ({ ...q }))
    };
    localStorage.setItem('pirateers_save', JSON.stringify(saveData));
    return true;
}

function loadGame() {
    const saved = localStorage.getItem('pirateers_save');
    if (!saved) return false;

    try {
        const saveData = JSON.parse(saved);
        gameData.day = saveData.day;
        gameData.gold = saveData.gold;
        gameData.ship = saveData.ship;
        gameData.cargo = saveData.cargo;
        gameData.cargoMax = saveData.cargoMax;
        gameData.weapons = saveData.weapons;
        gameData.neptunesPieces = saveData.neptunesPieces;
        gameData.statistics = saveData.statistics;
        gameData.activeQuests = saveData.activeQuests;
        return true;
    } catch (e) {
        return false;
    }
}

function hasSave() {
    return localStorage.getItem('pirateers_save') !== null;
}

// Start game
const game = new Phaser.Game(config);
window.game = game;
window.gameData = gameData;
