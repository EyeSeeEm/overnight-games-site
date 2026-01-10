// Curious Expedition Clone - Phaser Version (Expanded & Polished)

// Color Palette
const COLORS = {
    parchment: 0xF5E6D3,
    parchmentDark: 0xE8D5C0,
    leather: 0x8B4513,
    leatherDark: 0x5D2E0C,
    inkBrown: 0x3E2723,
    buttonBg: 0x4A3728,
    buttonBorder: 0x2E1F14,
    goldAccent: 0xD4A84B,
    dangerRed: 0xC62828,
    highlightRed: 0xB85450,
    grassland: 0x5A8F3E,
    jungle: 0x2E7D32,
    jungleDark: 0x1B5E20,
    desert: 0xD4A559,
    water: 0x2E6B8A,
    mountain: 0x6B5B4F,
    swamp: 0x3A5A3A,
    daySky: 0x6BC5D2,
    nightSky: 0x1A1A3E,
    sanityBlue: 0x4A90B8,
    healthRed: 0xB85450,
    fogOfWar: 0x2A2A4A
};

// Weather Types
const WEATHER_TYPES = ['clear', 'cloudy', 'rainy', 'foggy'];

// Achievements
const ACHIEVEMENTS = {
    firstPyramid: { name: 'Pyramid Found', desc: 'Found your first Golden Pyramid', unlocked: false },
    fiveExpeditions: { name: 'Seasoned Explorer', desc: 'Complete 5 expeditions', unlocked: false },
    noLosses: { name: 'Perfect Expedition', desc: 'Complete without losing party members', unlocked: false },
    richExplorer: { name: 'Fortune Seeker', desc: 'Collect 500 fame', unlocked: false },
    treasureHunter: { name: 'Treasure Hunter', desc: 'Find 10 treasures', unlocked: false },
    survivor: { name: 'Survivor', desc: 'Survive with less than 10 sanity', unlocked: false }
};

// Boot Scene for texture generation
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.scene.start('GameScene');
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.graphics = this.add.graphics();

        // Game State
        this.gameState = {
            state: 'title',
            day: 1,
            expedition: 1,
            fame: 0,
            totalTreasures: 0,
            completedExpeditions: 0
        };

        // Weather
        this.weather = 'clear';
        this.weatherTimer = 0;

        // Party
        this.party = {
            sanity: 100,
            maxSanity: 100,
            members: [
                { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3, ability: 'leadership' },
                { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2, ability: 'pathfinding' },
                { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2, ability: 'carrying' }
            ],
            inventory: ['Torch', 'Rope', 'Whiskey', 'Medicine'],
            blessings: [],
            curses: [],
            x: 0,
            y: 0
        };

        // Map Configuration
        this.MAP_WIDTH = 12;
        this.MAP_HEIGHT = 10;

        // Terrain Types
        this.TERRAIN_TYPES = {
            grass: { cost: 2, passable: true, name: 'Grassland' },
            jungle: { cost: 5, passable: true, name: 'Light Jungle' },
            thickJungle: { cost: 10, passable: true, name: 'Thick Jungle' },
            desert: { cost: 8, passable: true, name: 'Desert' },
            swamp: { cost: 12, passable: true, name: 'Swamp' },
            water: { cost: 0, passable: false, name: 'Deep Water' },
            mountain: { cost: 0, passable: false, name: 'Mountain' }
        };

        // Map Data
        this.hexMap = [];
        this.locations = [];
        this.fogOfWar = [];
        this.pyramidFound = false;

        // Event System
        this.currentEvent = null;
        this.eventChoices = [];
        this.selectedChoice = -1;

        // Journal
        this.journalText = '';
        this.journalDay = 1;

        // Visual Effects
        this.screenShake = 0;
        this.screenFlash = null;
        this.floatingTexts = [];
        this.particles = [];
        this.treeSwayTime = 0;

        // Events Database
        this.EVENTS = {
            village: {
                title: 'Native Village',
                text: 'We entered a native village of a warrior tribe. The villagers had been awaiting us. They seemed to know about us already.',
                choices: [
                    { text: 'Trade goods', result: 'trade' },
                    { text: 'Rest (+20 Sanity)', result: 'rest' },
                    { text: 'Hire guide (cost item)', result: 'hire' },
                    { text: 'Leave quietly', result: 'leave' }
                ]
            },
            shrine: {
                title: 'Ancient Shrine',
                text: 'We discovered an ancient shrine covered in strange symbols. The air feels heavy with mystical energy.',
                choices: [
                    { text: 'Investigate', result: 'investigate' },
                    { text: 'Make an offering', result: 'offering' },
                    { text: 'Pray for blessing', result: 'bless' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            pyramid: {
                title: 'The Golden Pyramid',
                text: 'There was the golden pyramid, enthroned above the landscape. I found the goal of my journey!',
                choices: [
                    { text: 'Enter the pyramid', result: 'enterPyramid' },
                    { text: 'Search perimeter', result: 'searchPyramid' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            cave: {
                title: 'Dark Cave',
                text: 'A dark cave entrance looms before us. Strange sounds echo from within. There could be treasures... or dangers.',
                choices: [
                    { text: 'Explore with torch', result: 'exploreCave' },
                    { text: 'Send scout ahead', result: 'scoutCave' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            oasis: {
                title: 'Desert Oasis',
                text: 'We stumbled upon a beautiful oasis. Crystal clear water and shade from palm trees.',
                choices: [
                    { text: 'Rest (+30 Sanity)', result: 'oasisRest' },
                    { text: 'Fill canteens', result: 'fillWater' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            ruins: {
                title: 'Ancient Ruins',
                text: 'Crumbling stone columns and arches hint at a civilization lost to time. Treasures may lie buried here.',
                choices: [
                    { text: 'Search thoroughly', result: 'searchRuins' },
                    { text: 'Quick search', result: 'quickSearch' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            tradingPost: {
                title: 'Trading Post',
                text: 'A small trading post run by merchants. They offer supplies and services for the right price.',
                choices: [
                    { text: 'Buy supplies (20 fame)', result: 'buySupplies' },
                    { text: 'Sell treasures', result: 'sellTreasures' },
                    { text: 'Rest (+25 Sanity)', result: 'tradingRest' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            waterfall: {
                title: 'Hidden Waterfall',
                text: 'A stunning waterfall cascades down mossy rocks. The mist is refreshing and the pool looks inviting.',
                choices: [
                    { text: 'Bathe (+35 Sanity)', result: 'bathe' },
                    { text: 'Search behind falls', result: 'behindFalls' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            nightCamp: {
                title: 'Night Camp',
                text: 'I decided it would be a good idea to stay here and rest. The night was bleak as we sat by the fire.',
                choices: [
                    { text: 'Rest until dawn (+15 Sanity)', result: 'campRest' },
                    { text: 'Keep watch', result: 'watch' },
                    { text: 'Tell stories (+5 Sanity)', result: 'stories' }
                ]
            },
            animalAttack: {
                title: 'Wild Animal Attack!',
                text: 'A predator lunges from the undergrowth! We must act fast!',
                choices: [
                    { text: 'Fight it!', result: 'fightAnimal' },
                    { text: 'Run away!', result: 'fleeAnimal' },
                    { text: 'Distract with food', result: 'distractAnimal' }
                ]
            },
            nativeEncounter: {
                title: 'Native Tribe Encountered',
                text: 'A group of natives approaches. Their intentions are unclear.',
                choices: [
                    { text: 'Offer gifts', result: 'giftNatives' },
                    { text: 'Try to communicate', result: 'communicateNatives' },
                    { text: 'Retreat slowly', result: 'retreatNatives' }
                ]
            },
            treasure: {
                title: 'Treasure Found!',
                text: 'Glinting in the sunlight, you spot something valuable partially buried.',
                choices: [
                    { text: 'Dig it up!', result: 'digTreasure' },
                    { text: 'Check for traps', result: 'checkTraps' },
                    { text: 'Leave it', result: 'leave' }
                ]
            },
            sickness: {
                title: 'Illness Strikes',
                text: 'One of our party members has fallen ill. They need treatment.',
                choices: [
                    { text: 'Use medicine', result: 'useMedicine' },
                    { text: 'Rest and hope', result: 'restSick' },
                    { text: 'Press on', result: 'pressOn' }
                ]
            },
            portal: {
                title: 'Mysterious Portal',
                text: 'Strange energies swirl in a glowing doorway. It seems to lead... somewhere else.',
                choices: [
                    { text: 'Enter portal', result: 'enterPortal' },
                    { text: 'Study it', result: 'studyPortal' },
                    { text: 'Leave', result: 'leave' }
                ]
            },
            lowSanity: {
                title: 'Madness Approaches',
                text: 'The stress of the journey weighs heavily. Strange whispers fill the air.',
                choices: [
                    { text: 'Take a break', result: 'sanityBreak' },
                    { text: 'Drink whiskey', result: 'drinkWhiskey' },
                    { text: 'Push through', result: 'pushThrough' }
                ]
            }
        };

        this.generateMap();
        this.revealFog(this.party.x, this.party.y);
        this.journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
        this.journalDay = this.gameState.day;

        // Input handling
        this.input.on('pointerdown', this.handleClick, this);
        this.input.on('pointermove', this.handleMouseMove, this);
    }

    update(time, delta) {
        this.graphics.clear();

        // Update effects
        this.treeSwayTime += delta * 0.001;
        this.updateParticles(delta);
        this.updateFloatingTexts(delta);

        // Weather timer
        this.weatherTimer += delta;
        if (this.weatherTimer > 30000) {
            this.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
            this.weatherTimer = 0;
        }

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            this.cameras.main.setScroll(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
            if (this.screenShake < 0.5) {
                this.screenShake = 0;
                this.cameras.main.setScroll(0, 0);
            }
        }

        if (this.gameState.state === 'title') {
            this.drawTitleScreen();
        } else {
            this.drawMap();
            this.drawJournal();
            this.drawWeatherIndicator();
            this.drawParticles();
            this.drawFloatingTexts();

            if (this.gameState.state === 'gameOver') {
                this.drawGameOver();
            } else if (this.gameState.state === 'victory') {
                this.drawVictory();
            }
        }

        // Screen flash
        if (this.screenFlash) {
            this.graphics.fillStyle(this.screenFlash.color, this.screenFlash.alpha);
            this.graphics.fillRect(0, 0, 960, 640);
            this.screenFlash.alpha -= 0.05;
            if (this.screenFlash.alpha <= 0) this.screenFlash = null;
        }
    }

    // Effects
    addFloatingText(x, y, text, color = '#FFFFFF') {
        this.floatingTexts.push({ x, y, text, color, life: 1.5, startY: y });
    }

    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= delta * 0.001;
            ft.y = ft.startY - (1.5 - ft.life) * 30;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    drawFloatingTexts() {
        for (const ft of this.floatingTexts) {
            const textObj = this.add.text(ft.x, ft.y, ft.text, {
                fontFamily: 'Georgia', fontSize: '16px', fontStyle: 'bold', color: ft.color
            }).setOrigin(0.5).setAlpha(ft.life / 1.5);
            this.time.delayedCall(16, () => textObj.destroy());
        }
    }

    addParticle(x, y, color, vx = 0, vy = 0) {
        this.particles.push({ x, y, color, vx: vx + (Math.random() - 0.5) * 2, vy: vy - Math.random() * 2, life: 1 });
    }

    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= delta * 0.002;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        for (const p of this.particles) {
            this.graphics.fillStyle(p.color, p.life);
            this.graphics.fillCircle(p.x, p.y, 3 * p.life);
        }
    }

    triggerScreenShake(intensity = 5) {
        this.screenShake = intensity;
    }

    triggerScreenFlash(color = 0xFF0000) {
        this.screenFlash = { color, alpha: 0.4 };
    }

    // Generate hex map
    generateMap() {
        this.hexMap = [];
        this.locations = [];
        this.fogOfWar = [];

        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.hexMap[y] = [];
            this.fogOfWar[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const rand = Math.random();
                let terrain;
                if (rand < 0.30) terrain = 'grass';
                else if (rand < 0.48) terrain = 'jungle';
                else if (rand < 0.62) terrain = 'thickJungle';
                else if (rand < 0.72) terrain = 'desert';
                else if (rand < 0.80) terrain = 'swamp';
                else if (rand < 0.90) terrain = 'water';
                else terrain = 'mountain';

                this.hexMap[y][x] = terrain;
                this.fogOfWar[y][x] = true;
            }
        }

        this.party.x = 1;
        this.party.y = Math.floor(this.MAP_HEIGHT / 2);
        this.hexMap[this.party.y][this.party.x] = 'grass';
        this.hexMap[this.party.y][this.party.x + 1] = 'grass';

        const pyramidX = this.MAP_WIDTH - 2;
        const pyramidY = Math.floor(this.MAP_HEIGHT / 2) + Math.floor(Math.random() * 3) - 1;
        this.locations.push({ x: pyramidX, y: pyramidY, type: 'pyramid' });
        this.hexMap[pyramidY][pyramidX] = 'grass';

        // Place locations
        for (let i = 0; i < 2; i++) this.placeLocation('village');
        for (let i = 0; i < 2; i++) this.placeLocation('shrine');
        this.placeLocation('cave');
        this.placeLocation('oasis');
        this.placeLocation('ruins');
        this.placeLocation('tradingPost');
        this.placeLocation('waterfall');
    }

    placeLocation(type) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * (this.MAP_WIDTH - 4)) + 2;
            const y = Math.floor(Math.random() * (this.MAP_HEIGHT - 2)) + 1;

            let valid = true;
            for (const loc of this.locations) {
                const dist = Math.abs(loc.x - x) + Math.abs(loc.y - y);
                if (dist < 3) {
                    valid = false;
                    break;
                }
            }

            if (valid && this.hexMap[y][x] !== 'water' && this.hexMap[y][x] !== 'mountain') {
                this.locations.push({ x, y, type });
                this.hexMap[y][x] = 'grass';
                break;
            }
            attempts++;
        }
    }

    revealFog(x, y) {
        const range = this.party.members.some(m => m.ability === 'pathfinding' && m.health > 0) ? 3 : 2;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.MAP_WIDTH && ny >= 0 && ny < this.MAP_HEIGHT) {
                    if (Math.abs(dx) + Math.abs(dy) <= range + 1) {
                        this.fogOfWar[ny][nx] = false;
                    }
                }
            }
        }
    }

    getNeighbors(x, y) {
        const odd = x % 2;
        return [
            { x: x + 1, y: y + (odd ? 0 : -1) },
            { x: x + 1, y: y + (odd ? 1 : 0) },
            { x: x - 1, y: y + (odd ? 0 : -1) },
            { x: x - 1, y: y + (odd ? 1 : 0) },
            { x: x, y: y - 1 },
            { x: x, y: y + 1 }
        ];
    }

    // Draw the map / scene panel
    drawMap() {
        const isNight = this.gameState.day % 5 === 0;

        if (this.gameState.state === 'event' && this.currentEvent) {
            this.drawEventScene(this.currentEvent, isNight);
        } else {
            this.drawExplorationScene(isNight);
        }
    }

    drawWeatherIndicator() {
        const weatherIcons = { clear: '☀', cloudy: '☁', rainy: '🌧', foggy: '🌫' };
        const text = this.add.text(930, 20, weatherIcons[this.weather] || '☀', {
            fontSize: '24px'
        }).setOrigin(1, 0);
        this.time.delayedCall(16, () => text.destroy());
    }

    drawEventScene(eventType, isNight) {
        const x = 520;

        switch(eventType) {
            case 'village':
                this.drawVillageScene(x, isNight);
                break;
            case 'shrine':
                this.drawShrineScene(x, isNight);
                break;
            case 'pyramid':
                this.drawPyramidScene(x, isNight);
                break;
            case 'cave':
                this.drawCaveScene(x, isNight);
                break;
            case 'oasis':
                this.drawOasisScene(x, isNight);
                break;
            case 'ruins':
                this.drawRuinsScene(x, isNight);
                break;
            case 'tradingPost':
                this.drawTradingPostScene(x, isNight);
                break;
            case 'waterfall':
                this.drawWaterfallScene(x, isNight);
                break;
            case 'nightCamp':
            case 'lowSanity':
                this.drawCampScene(x);
                break;
            case 'animalAttack':
            case 'nativeEncounter':
            case 'treasure':
            case 'sickness':
                this.drawJungleScene(x, isNight);
                break;
            case 'portal':
                this.drawPortalScene(x, isNight);
                break;
            default:
                this.drawJungleScene(x, isNight);
        }
    }

    drawExplorationScene(isNight) {
        const x = 520;
        this.drawJungleScene(x, isNight);
        this.drawMiniMap(x + 20, 20);
    }

    drawVillageScene(x, isNight) {
        // Sky
        this.graphics.fillStyle(isNight ? 0x1A1A3E : 0x4ECDC4);
        this.graphics.fillRect(x, 0, 440, 640);

        // Background mountains
        this.graphics.fillStyle(isNight ? 0x1A3A2A : 0x3E8B4E);
        this.drawMountainRange(x, 80, 440, 100);

        // Animated Trees
        const treeColor = isNight ? 0x1A4A2A : 0x2E7D32;
        for (let i = 0; i < 10; i++) {
            const sway = Math.sin(this.treeSwayTime + i * 0.5) * 3;
            this.drawTree(x + 30 + i * 45 + sway, 150 + Math.sin(i) * 20, 40 + Math.random() * 20, treeColor);
        }

        // Ground
        this.graphics.fillStyle(isNight ? 0x2A4A2A : 0x5A8F3E);
        this.graphics.fillRect(x, 350, 440, 290);

        // Grass texture
        this.graphics.fillStyle(isNight ? 0x3A5A3A : 0x6BA34E);
        for (let i = 0; i < 50; i++) {
            this.graphics.fillRect(x + Math.random() * 440, 360 + Math.random() * 200, 3, 8);
        }

        // Huts
        this.drawHut(x + 120, 320, 80, 70);
        this.drawHut(x + 250, 300, 100, 90);
        this.drawHut(x + 350, 340, 70, 60);

        // Fence
        this.graphics.fillStyle(0x5D4037);
        for (let i = 0; i < 12; i++) {
            this.graphics.fillRect(x + 300 + i * 12, 480, 6, 40);
            this.graphics.fillRect(x + 300 + i * 12, 470, 6, 15);
        }

        // Villagers
        this.drawPixelPerson(x + 180, 420, 0x8B4513, 0xB85450);
        this.drawPixelPerson(x + 280, 440, 0x6B3A0A, 0x4A90B8);
        this.drawPixelPerson(x + 350, 430, 0x8B4513, 0xC4A35A);

        // Party
        this.drawExplorerSprite(x + 220, 450);
        this.drawDonkeySprite(x + 260, 460);
    }

    drawPyramidScene(x, isNight) {
        // Sky
        this.graphics.fillStyle(0x4ECDC4);
        this.graphics.fillRect(x, 0, 440, 640);

        // Clouds
        this.graphics.fillStyle(0xFFFFFF);
        this.drawCloud(x + 80, 60, 50);
        this.drawCloud(x + 280, 40, 40);
        this.drawCloud(x + 380, 80, 35);

        // Mountains
        this.graphics.fillStyle(0x5A8A6E);
        this.drawMountainRange(x, 150, 440, 80);

        // Trees behind pyramid
        for (let i = 0; i < 15; i++) {
            this.drawTree(x + 20 + i * 30, 200 + Math.sin(i * 0.8) * 30, 50, 0x2E7D32);
        }

        // Golden Pyramid with glow animation
        this.drawGoldenPyramid(x + 220, 120, 200, 250);

        // Ground
        this.graphics.fillStyle(0x5A8F3E);
        this.graphics.fillRect(x, 500, 440, 140);

        // Path
        this.graphics.fillStyle(0x7A8A5A);
        this.graphics.beginPath();
        this.graphics.moveTo(x + 180, 640);
        this.graphics.lineTo(x + 260, 640);
        this.graphics.lineTo(x + 235, 500);
        this.graphics.lineTo(x + 205, 500);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Foreground trees
        this.drawTree(x + 50, 480, 60, 0x1B5E20);
        this.drawTree(x + 380, 470, 70, 0x1B5E20);

        // Party
        this.drawExplorerSprite(x + 200, 560);
        this.drawDonkeySprite(x + 160, 570);

        // Sparkle particles
        if (Math.random() < 0.3) {
            this.addParticle(x + 220 + (Math.random() - 0.5) * 100, 200 + Math.random() * 100, 0xFFD700);
        }
    }

    drawCampScene(x) {
        // Night sky
        this.graphics.fillStyle(0x0D0D1A);
        this.graphics.fillRect(x, 0, 440, 320);
        this.graphics.fillStyle(0x1A2A2A);
        this.graphics.fillRect(x, 320, 440, 320);

        // Stars
        this.graphics.fillStyle(0xFFFFFF);
        for (let i = 0; i < 50; i++) {
            const twinkle = Math.sin(this.treeSwayTime * 3 + i) > 0.5 ? 1 : 0.5;
            this.graphics.fillStyle(0xFFFFFF, twinkle);
            this.graphics.fillRect(x + Math.random() * 440, Math.random() * 300, 2, 2);
        }

        // Moon
        this.graphics.fillStyle(0xE8E8D0);
        this.graphics.fillCircle(x + 350, 80, 25);
        this.graphics.fillStyle(0x0D0D1A);
        this.graphics.fillCircle(x + 340, 75, 22);

        // Tree silhouettes
        this.graphics.fillStyle(0x0A1520);
        for (let i = 0; i < 8; i++) {
            this.drawTreeSilhouette(x + 30 + i * 55, 280, 80 + Math.random() * 40);
        }

        // Campfire glow
        const glowSize = 100 + Math.sin(this.treeSwayTime * 5) * 10;
        this.graphics.fillStyle(0xFF9632, 0.3);
        this.graphics.fillCircle(x + 220, 480, glowSize);

        // Campfire with particles
        this.drawCampfire(x + 220, 480);
        if (Math.random() < 0.2) {
            this.addParticle(x + 220, 450, 0xFF6B35, (Math.random() - 0.5) * 2, -3);
        }

        // Party around fire
        this.drawExplorerSprite(x + 150, 470);
        this.drawPixelPerson(x + 280, 465, 0x8B4513, 0x4A6FA5);
        this.drawDonkeySprite(x + 320, 450);
    }

    drawShrineScene(x, isNight) {
        // Background
        this.graphics.fillStyle(isNight ? 0x1A1A3E : 0x6BCFC4);
        this.graphics.fillRect(x, 0, 440, 640);

        // Forest
        const shrineTreeColor = isNight ? 0x1A3A2A : 0x2E6D32;
        for (let i = 0; i < 12; i++) {
            const sway = Math.sin(this.treeSwayTime + i * 0.3) * 2;
            this.drawTree(x + 20 + i * 38 + sway, 150, 70, shrineTreeColor);
        }

        // Ground
        this.graphics.fillStyle(isNight ? 0x2A3A2A : 0x4A7A4E);
        this.graphics.fillRect(x, 380, 440, 260);

        // Shrine with pulsing glow
        this.drawStoneShrine(x + 220, 300);

        // Animated glow
        const glowAlpha = 0.2 + Math.sin(this.treeSwayTime * 2) * 0.1;
        this.graphics.fillStyle(0xDAA520, glowAlpha);
        this.graphics.fillCircle(x + 220, 350, 80);

        // Party
        this.drawExplorerSprite(x + 150, 480);
        this.drawDonkeySprite(x + 100, 490);
    }

    drawCaveScene(x, isNight) {
        // Dark background
        this.graphics.fillStyle(0x1A1A1A);
        this.graphics.fillRect(x, 0, 440, 640);

        // Cave walls
        this.graphics.fillStyle(0x3A3A3A);
        this.graphics.beginPath();
        this.graphics.moveTo(x, 0);
        this.graphics.lineTo(x + 120, 0);
        this.graphics.lineTo(x + 80, 200);
        this.graphics.lineTo(x + 60, 640);
        this.graphics.lineTo(x, 640);
        this.graphics.closePath();
        this.graphics.fillPath();

        this.graphics.beginPath();
        this.graphics.moveTo(x + 440, 0);
        this.graphics.lineTo(x + 320, 0);
        this.graphics.lineTo(x + 360, 200);
        this.graphics.lineTo(x + 380, 640);
        this.graphics.lineTo(x + 440, 640);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Stalactites
        this.graphics.fillStyle(0x4A4A4A);
        for (let i = 0; i < 8; i++) {
            const sx = x + 100 + i * 35;
            const sh = 30 + Math.random() * 50;
            this.graphics.fillTriangle(sx - 10, 0, sx, sh, sx + 10, 0);
        }

        // Torch glow with flicker
        const torchGlow = 100 + Math.sin(this.treeSwayTime * 8) * 15;
        this.graphics.fillStyle(0xFF9632, 0.4);
        this.graphics.fillCircle(x + 180, 430, torchGlow);

        // Explorer with torch
        this.drawExplorerSprite(x + 180, 450);

        // Torch flame
        this.graphics.fillStyle(0xFF9932);
        this.graphics.fillEllipse(x + 195, 430, 16, 30);
    }

    drawOasisScene(x, isNight) {
        // Desert sky gradient
        this.graphics.fillStyle(0x87CEEB);
        this.graphics.fillRect(x, 0, 440, 200);
        this.graphics.fillStyle(0xF4D03F);
        this.graphics.fillRect(x, 200, 440, 200);
        this.graphics.fillStyle(0xD4A559);
        this.graphics.fillRect(x, 400, 440, 240);

        // Sand dunes
        this.graphics.fillStyle(0xD4A559);
        this.graphics.beginPath();
        this.graphics.moveTo(x, 300);
        this.graphics.lineTo(x + 100, 250);
        this.graphics.lineTo(x + 200, 300);
        this.graphics.lineTo(x + 300, 350);
        this.graphics.lineTo(x + 440, 280);
        this.graphics.lineTo(x + 440, 640);
        this.graphics.lineTo(x, 640);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Oasis water with ripple
        const ripple = Math.sin(this.treeSwayTime * 2) * 5;
        this.graphics.fillStyle(0x4ECDC4);
        this.graphics.fillEllipse(x + 220, 450, 200 + ripple, 100);
        this.graphics.fillStyle(0x3DBDB4);
        this.graphics.fillEllipse(x + 220, 470, 160 + ripple, 60);

        // Palm trees
        this.drawPalmTree(x + 150, 380, 80);
        this.drawPalmTree(x + 280, 370, 90);
        this.drawPalmTree(x + 320, 400, 60);

        // Party
        this.drawExplorerSprite(x + 200, 500);
        this.drawDonkeySprite(x + 250, 510);
    }

    drawRuinsScene(x, isNight) {
        // Sky
        this.graphics.fillStyle(isNight ? 0x1A1A3E : 0x6BC5D2);
        this.graphics.fillRect(x, 0, 440, 640);

        // Ground
        this.graphics.fillStyle(0x6A6A5A);
        this.graphics.fillRect(x, 400, 440, 240);

        // Broken columns
        this.graphics.fillStyle(0x8A8A7A);
        this.graphics.fillRect(x + 80, 250, 30, 150);
        this.graphics.fillRect(x + 180, 280, 25, 120);
        this.graphics.fillRect(x + 280, 230, 35, 170);
        this.graphics.fillRect(x + 350, 300, 28, 100);

        // Fallen stones
        this.graphics.fillStyle(0x7A7A6A);
        this.graphics.fillEllipse(x + 150, 420, 40, 20);
        this.graphics.fillEllipse(x + 320, 450, 50, 25);

        // Arch
        this.graphics.fillStyle(0x8A8A7A);
        this.graphics.fillRect(x + 200, 180, 25, 120);
        this.graphics.fillRect(x + 280, 180, 25, 120);
        this.graphics.beginPath();
        this.graphics.arc(x + 252, 180, 52, Math.PI, 0, false);
        this.graphics.fillPath();

        // Party
        this.drawExplorerSprite(x + 220, 470);
        this.drawDonkeySprite(x + 260, 480);
    }

    drawTradingPostScene(x, isNight) {
        // Sky
        this.graphics.fillStyle(0x6BC5D2);
        this.graphics.fillRect(x, 0, 440, 640);

        // Ground
        this.graphics.fillStyle(0x7A6A4A);
        this.graphics.fillRect(x, 380, 440, 260);

        // Building
        this.graphics.fillStyle(0x8B6914);
        this.graphics.fillRect(x + 150, 250, 140, 130);

        // Roof
        this.graphics.fillStyle(0x5D4037);
        this.graphics.fillTriangle(x + 150, 250, x + 220, 180, x + 290, 250);

        // Door
        this.graphics.fillStyle(0x3E2723);
        this.graphics.fillRect(x + 200, 320, 40, 60);

        // Sign
        this.graphics.fillStyle(0xC4A35A);
        this.graphics.fillRect(x + 300, 280, 80, 40);
        const signText = this.add.text(x + 340, 300, 'TRADE', {
            fontFamily: 'Georgia', fontSize: '14px', color: '#3E2723'
        }).setOrigin(0.5);
        this.time.delayedCall(16, () => signText.destroy());

        // Barrels
        this.graphics.fillStyle(0x5D4037);
        this.graphics.fillEllipse(x + 100, 430, 25, 35);
        this.graphics.fillEllipse(x + 350, 420, 25, 35);

        // Party
        this.drawExplorerSprite(x + 220, 470);
        this.drawDonkeySprite(x + 270, 480);
    }

    drawWaterfallScene(x, isNight) {
        // Sky
        this.graphics.fillStyle(0x6BC5D2);
        this.graphics.fillRect(x, 0, 440, 640);

        // Cliff
        this.graphics.fillStyle(0x5A5A4A);
        this.graphics.fillRect(x + 150, 0, 140, 350);

        // Waterfall
        this.graphics.fillStyle(0x4ECDC4, 0.8);
        this.graphics.fillRect(x + 180, 0, 80, 350);

        // Animated water
        for (let i = 0; i < 10; i++) {
            const wy = (this.treeSwayTime * 200 + i * 40) % 350;
            this.graphics.fillStyle(0xFFFFFF, 0.5);
            this.graphics.fillRect(x + 190 + Math.random() * 60, wy, 5, 20);
        }

        // Pool
        this.graphics.fillStyle(0x3DBDB4);
        this.graphics.fillEllipse(x + 220, 450, 150, 80);

        // Rocks
        this.graphics.fillStyle(0x5A5A4A);
        this.graphics.fillEllipse(x + 100, 400, 50, 30);
        this.graphics.fillEllipse(x + 340, 420, 40, 25);

        // Mist particles
        if (Math.random() < 0.3) {
            this.addParticle(x + 220 + (Math.random() - 0.5) * 100, 350 + Math.random() * 50, 0xFFFFFF);
        }

        // Party
        this.drawExplorerSprite(x + 150, 500);
        this.drawDonkeySprite(x + 100, 510);
    }

    drawPortalScene(x, isNight) {
        // Dark background
        this.graphics.fillStyle(0x1A1A3E);
        this.graphics.fillRect(x, 0, 440, 640);

        // Ground
        this.graphics.fillStyle(0x2A2A4A);
        this.graphics.fillRect(x, 450, 440, 190);

        // Portal with animation
        const portalSize = 80 + Math.sin(this.treeSwayTime * 3) * 10;
        this.graphics.fillStyle(0x8A4FFF, 0.3);
        this.graphics.fillCircle(x + 220, 300, portalSize + 40);
        this.graphics.fillStyle(0x6B2FEF, 0.5);
        this.graphics.fillCircle(x + 220, 300, portalSize + 20);
        this.graphics.fillStyle(0x4B0FBF, 0.8);
        this.graphics.fillCircle(x + 220, 300, portalSize);

        // Swirl particles
        for (let i = 0; i < 8; i++) {
            const angle = this.treeSwayTime * 2 + i * Math.PI / 4;
            const dist = 50 + Math.sin(this.treeSwayTime + i) * 20;
            this.graphics.fillStyle(0xAA7FFF);
            this.graphics.fillCircle(x + 220 + Math.cos(angle) * dist, 300 + Math.sin(angle) * dist, 5);
        }

        // Party
        this.drawExplorerSprite(x + 150, 500);
        this.drawDonkeySprite(x + 100, 510);
    }

    drawJungleScene(x, isNight) {
        // Sky with weather
        let skyColor = isNight ? 0x1A1A3E : 0x4ECDC4;
        if (this.weather === 'cloudy') skyColor = 0x7A9A9A;
        else if (this.weather === 'rainy') skyColor = 0x5A7A8A;
        else if (this.weather === 'foggy') skyColor = 0x8A9A9A;

        this.graphics.fillStyle(skyColor);
        this.graphics.fillRect(x, 0, 440, 640);

        // Rain effect
        if (this.weather === 'rainy') {
            this.graphics.fillStyle(0x6AAACC, 0.5);
            for (let i = 0; i < 50; i++) {
                const rx = x + Math.random() * 440;
                const ry = (this.treeSwayTime * 500 + i * 30) % 640;
                this.graphics.fillRect(rx, ry, 2, 10);
            }
        }

        // Fog effect
        if (this.weather === 'foggy') {
            this.graphics.fillStyle(0xFFFFFF, 0.2);
            this.graphics.fillRect(x, 0, 440, 640);
        }

        // Background trees
        const bgColor = isNight ? 0x1A3A2A : 0x3E8B4E;
        for (let i = 0; i < 12; i++) {
            const sway = Math.sin(this.treeSwayTime + i * 0.4) * 3;
            this.drawTree(x + 20 + i * 38 + sway, 120 + Math.sin(i) * 30, 60, bgColor);
        }

        // Mid trees
        const midColor = isNight ? 0x1A4A2A : 0x2E7D32;
        for (let i = 0; i < 10; i++) {
            const sway = Math.sin(this.treeSwayTime * 0.8 + i * 0.3) * 4;
            this.drawTree(x + 10 + i * 45 + sway, 200 + Math.cos(i) * 20, 70, midColor);
        }

        // Ground
        this.graphics.fillStyle(isNight ? 0x1A3A2A : 0x4A8A4E);
        this.graphics.fillRect(x, 400, 440, 240);

        // Foreground trees
        const fgColor = isNight ? 0x0A2A1A : 0x1B5E20;
        for (let i = 0; i < 6; i++) {
            const sway = Math.sin(this.treeSwayTime * 0.6 + i * 0.2) * 5;
            this.drawTree(x + i * 80 + sway, 500, 100, fgColor);
        }

        // Party
        this.drawExplorerSprite(x + 220, 480);
        this.drawDonkeySprite(x + 180, 490);
    }

    // Helper drawing functions
    drawTree(x, y, height, color) {
        // Trunk
        this.graphics.fillStyle(0x5D4037);
        this.graphics.fillRect(x - 5, y, 10, height * 0.3);

        // Foliage
        this.graphics.fillStyle(color);
        for (let i = 0; i < 3; i++) {
            this.graphics.fillCircle(x, y - height * 0.2 - i * height * 0.2, height * 0.3 - i * 5);
        }
    }

    drawTreeSilhouette(x, y, height) {
        this.graphics.fillTriangle(x - height * 0.4, y, x, y - height, x + height * 0.4, y);
    }

    drawMountainRange(x, y, width, height) {
        this.graphics.beginPath();
        this.graphics.moveTo(x, y + height);
        for (let i = 0; i <= width; i += 40) {
            const peakHeight = height * (0.5 + Math.sin(i * 0.05) * 0.5);
            this.graphics.lineTo(x + i, y + height - peakHeight);
        }
        this.graphics.lineTo(x + width, y + height);
        this.graphics.closePath();
        this.graphics.fillPath();
    }

    drawCloud(x, y, size) {
        this.graphics.fillCircle(x, y, size);
        this.graphics.fillCircle(x + size * 0.8, y - size * 0.2, size * 0.7);
        this.graphics.fillCircle(x + size * 1.4, y, size * 0.6);
    }

    drawHut(x, y, width, height) {
        // Roof
        this.graphics.fillStyle(0xC4A35A);
        this.graphics.fillTriangle(x + width / 2, y - height * 0.4, x - width * 0.1, y + height * 0.3, x + width * 1.1, y + height * 0.3);

        // Walls
        this.graphics.fillStyle(0x8B6914);
        this.graphics.fillRect(x, y + height * 0.3, width, height * 0.5);

        // Door
        this.graphics.fillStyle(0x3E2723);
        this.graphics.fillRect(x + width * 0.4, y + height * 0.45, width * 0.2, height * 0.35);
    }

    drawGoldenPyramid(x, y, width, height) {
        // Main body
        this.graphics.fillStyle(0xDAA520);
        this.graphics.fillTriangle(x, y, x - width / 2, y + height, x + width / 2, y + height);

        // Shading
        this.graphics.fillStyle(0xB8860B);
        this.graphics.fillTriangle(x, y, x + width / 2, y + height, x, y + height);

        // Entrance
        this.graphics.fillStyle(0x2A1A0A);
        this.graphics.fillTriangle(x, y + height * 0.6, x - width * 0.08, y + height, x + width * 0.08, y + height);

        // Animated glow
        const glowSize = 15 + Math.sin(this.treeSwayTime * 2) * 5;
        this.graphics.fillStyle(0xFFD700);
        this.graphics.fillCircle(x, y + 20, glowSize);
    }

    drawStoneShrine(x, y) {
        // Base
        this.graphics.fillStyle(0x6A6A5A);
        this.graphics.fillRect(x - 60, y + 60, 120, 30);

        // Pillars
        this.graphics.fillStyle(0x7A7A6A);
        this.graphics.fillRect(x - 50, y - 20, 20, 80);
        this.graphics.fillRect(x + 30, y - 20, 20, 80);

        // Top
        this.graphics.fillRect(x - 55, y - 35, 110, 20);

        // Altar
        this.graphics.fillStyle(0x5A5A4A);
        this.graphics.fillRect(x - 20, y + 20, 40, 40);

        // Artifact
        this.graphics.fillStyle(0xDAA520);
        this.graphics.fillCircle(x, y + 30, 12);
    }

    drawPalmTree(x, y, height) {
        // Trunk
        this.graphics.fillStyle(0x8B6914);
        this.graphics.fillRect(x - 6, y, 12, height);

        // Fronds with sway
        this.graphics.fillStyle(0x2E7D32);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.sin(this.treeSwayTime) * 0.1;
            this.graphics.fillEllipse(x + Math.cos(angle) * 20, y - 10 + Math.sin(angle) * 10, 16, 40);
        }
    }

    drawCampfire(x, y) {
        // Logs
        this.graphics.fillStyle(0x5D4037);
        this.graphics.fillRect(x - 25, y + 5, 50, 10);

        // Fire with animation
        const flicker = Math.sin(this.treeSwayTime * 10) * 5;
        this.graphics.fillStyle(0xFF6B35);
        this.graphics.beginPath();
        this.graphics.moveTo(x - 15, y + 5);
        this.graphics.lineTo(x, y - 45 + flicker);
        this.graphics.lineTo(x + 15, y + 5);
        this.graphics.closePath();
        this.graphics.fillPath();

        this.graphics.fillStyle(0xFFD93D);
        this.graphics.beginPath();
        this.graphics.moveTo(x - 8, y + 5);
        this.graphics.lineTo(x, y - 30 + flicker);
        this.graphics.lineTo(x + 8, y + 5);
        this.graphics.closePath();
        this.graphics.fillPath();
    }

    drawPixelPerson(x, y, skinColor, clothColor) {
        this.graphics.fillStyle(skinColor);
        this.graphics.fillRect(x - 4, y - 20, 8, 8);
        this.graphics.fillStyle(clothColor);
        this.graphics.fillRect(x - 5, y - 12, 10, 12);
        this.graphics.fillStyle(skinColor);
        this.graphics.fillRect(x - 4, y, 3, 8);
        this.graphics.fillRect(x + 1, y, 3, 8);
    }

    drawExplorerSprite(x, y) {
        // Hat
        this.graphics.fillStyle(0x8B4513);
        this.graphics.fillRect(x - 10, y - 28, 20, 4);
        this.graphics.fillRect(x - 6, y - 35, 12, 8);
        // Head
        this.graphics.fillStyle(0xE8B89D);
        this.graphics.fillRect(x - 5, y - 24, 10, 10);
        // Body
        this.graphics.fillStyle(0x4A6FA5);
        this.graphics.fillRect(x - 6, y - 14, 12, 14);
        // Legs
        this.graphics.fillStyle(0xC4A35A);
        this.graphics.fillRect(x - 5, y, 4, 10);
        this.graphics.fillRect(x + 1, y, 4, 10);
        // Boots
        this.graphics.fillStyle(0x3E2723);
        this.graphics.fillRect(x - 5, y + 8, 4, 4);
        this.graphics.fillRect(x + 1, y + 8, 4, 4);
    }

    drawDonkeySprite(x, y) {
        // Body
        this.graphics.fillStyle(0x8B7355);
        this.graphics.fillRect(x - 12, y - 8, 24, 14);
        this.graphics.fillRect(x - 18, y - 12, 10, 10);
        // Ears
        this.graphics.fillRect(x - 18, y - 18, 3, 8);
        this.graphics.fillRect(x - 12, y - 18, 3, 8);
        // Legs
        this.graphics.fillRect(x - 10, y + 6, 4, 10);
        this.graphics.fillRect(x + 6, y + 6, 4, 10);
        // Cargo
        this.graphics.fillStyle(0x5D4037);
        this.graphics.fillRect(x - 8, y - 14, 16, 8);
    }

    drawMiniMap(x, y) {
        const miniSize = 6;
        const padding = 8;
        const mapW = this.MAP_WIDTH * miniSize + padding * 2;
        const mapH = this.MAP_HEIGHT * miniSize + padding * 2;

        // Background
        this.graphics.fillStyle(0x000000, 0.7);
        this.graphics.fillRect(x, y, mapW, mapH);

        // Border
        this.graphics.lineStyle(2, 0xDAA520);
        this.graphics.strokeRect(x, y, mapW, mapH);

        // Terrain
        for (let my = 0; my < this.MAP_HEIGHT; my++) {
            for (let mx = 0; mx < this.MAP_WIDTH; mx++) {
                const px = x + padding + mx * miniSize;
                const py = y + padding + my * miniSize;

                if (this.fogOfWar[my][mx]) {
                    this.graphics.fillStyle(0x2A2A4A);
                } else {
                    const terrain = this.hexMap[my][mx];
                    const colors = {
                        grass: 0x5A8F3E, jungle: 0x2E7D32, thickJungle: 0x1B5E20,
                        desert: 0xD4A559, swamp: 0x3A5A3A, water: 0x2E6B8A, mountain: 0x6B5B4F
                    };
                    this.graphics.fillStyle(colors[terrain] || 0x5A8F3E);
                }
                this.graphics.fillRect(px, py, miniSize - 1, miniSize - 1);
            }
        }

        // Locations
        for (const loc of this.locations) {
            if (!this.fogOfWar[loc.y][loc.x]) {
                const px = x + padding + loc.x * miniSize;
                const py = y + padding + loc.y * miniSize;
                this.graphics.fillStyle(loc.type === 'pyramid' ? 0xFFD700 : 0xFFFFFF);
                this.graphics.fillRect(px, py, miniSize - 1, miniSize - 1);
            }
        }

        // Party (pulsing)
        const pulse = Math.sin(this.treeSwayTime * 5) > 0 ? 0xFF0000 : 0xFF5555;
        this.graphics.fillStyle(pulse);
        this.graphics.fillRect(x + padding + this.party.x * miniSize, y + padding + this.party.y * miniSize, miniSize - 1, miniSize - 1);
    }

    // Draw journal (left panel)
    drawJournal() {
        // Leather binding
        this.graphics.fillStyle(COLORS.leatherDark);
        this.graphics.fillRect(40, 40, 25, 560);
        this.graphics.fillStyle(COLORS.leather);
        this.graphics.fillRect(50, 45, 15, 550);

        // Parchment
        this.graphics.fillStyle(COLORS.parchment);
        this.graphics.fillRect(65, 50, 435, 540);

        // Border
        this.graphics.lineStyle(2, COLORS.inkBrown);
        this.graphics.strokeRect(75, 60, 415, 520);

        // Clasps
        this.graphics.fillStyle(0x8A8A7A);
        this.graphics.fillRect(495, 150, 12, 25);
        this.graphics.fillRect(495, 400, 12, 25);

        // Day header
        const dayText = this.add.text(282, 85, `Day ${this.journalDay}`, { fontFamily: 'Georgia', fontSize: '24px', fontStyle: 'italic', color: '#3E2723' });
        dayText.setOrigin(0.5, 0.5);
        this.time.delayedCall(16, () => dayText.destroy());

        // Journal text
        const journalTextObj = this.add.text(95, 130, this.journalText, { fontFamily: 'Georgia', fontSize: '16px', color: '#3E2723', wordWrap: { width: 380 } });
        this.time.delayedCall(16, () => journalTextObj.destroy());

        // Draw choices if in event
        if (this.gameState.state === 'event' && this.eventChoices.length > 0) {
            this.drawEventChoices();
        }

        // Status bar
        this.drawStatusBar();
    }

    drawEventChoices() {
        const startY = 320;
        const buttonWidth = 380;
        const buttonHeight = 40;
        const gap = 8;

        for (let i = 0; i < this.eventChoices.length; i++) {
            const y = startY + i * (buttonHeight + gap);
            const isHovered = this.selectedChoice === i;

            // Button bg with hover effect
            this.graphics.fillStyle(isHovered ? 0x5A4738 : COLORS.buttonBg);
            this.graphics.fillRect(95, y, buttonWidth, buttonHeight);

            // Corners
            this.graphics.lineStyle(2, COLORS.goldAccent);
            this.drawCorner(95, y, 12, false, false);
            this.drawCorner(95 + buttonWidth, y, 12, true, false);
            this.drawCorner(95, y + buttonHeight, 12, false, true);
            this.drawCorner(95 + buttonWidth, y + buttonHeight, 12, true, true);

            // Text
            const choiceText = this.add.text(115, y + 20, `${i + 1}. ${this.eventChoices[i].text}`, { fontFamily: 'Georgia', fontSize: '16px', color: '#F5E6D3' });
            choiceText.setOrigin(0, 0.5);
            this.time.delayedCall(16, () => choiceText.destroy());
        }
    }

    drawCorner(x, y, size, flipX, flipY) {
        const dx = flipX ? -1 : 1;
        const dy = flipY ? -1 : 1;

        this.graphics.beginPath();
        this.graphics.moveTo(x, y + dy * size);
        this.graphics.lineTo(x, y);
        this.graphics.lineTo(x + dx * size, y);
        this.graphics.strokePath();

        this.graphics.beginPath();
        this.graphics.moveTo(x + dx * 4, y + dy * (size - 4));
        this.graphics.lineTo(x + dx * 4, y + dy * 4);
        this.graphics.lineTo(x + dx * (size - 4), y + dy * 4);
        this.graphics.strokePath();
    }

    drawStatusBar() {
        const barY = 545;

        // Sanity label
        const sanityLabel = this.add.text(95, barY, 'Sanity:', { fontFamily: 'Georgia', fontSize: '14px', color: '#3E2723' });
        this.time.delayedCall(16, () => sanityLabel.destroy());

        // Bar bg
        this.graphics.fillStyle(0x3A3A3A);
        this.graphics.fillRect(150, barY - 12, 150, 16);

        // Bar fill with animated color
        const sanityPercent = this.party.sanity / this.party.maxSanity;
        let barColor = COLORS.sanityBlue;
        if (sanityPercent <= 0.5) barColor = 0xD4A559;
        if (sanityPercent <= 0.25) {
            barColor = Math.sin(this.treeSwayTime * 5) > 0 ? COLORS.dangerRed : 0xFF5555;
        }
        this.graphics.fillStyle(barColor);
        this.graphics.fillRect(150, barY - 12, 150 * sanityPercent, 16);

        // Sanity text
        const sanityText = this.add.text(225, barY - 4, `${this.party.sanity}/${this.party.maxSanity}`, { fontFamily: 'Georgia', fontSize: '12px', color: '#FFFFFF' });
        sanityText.setOrigin(0.5, 0.5);
        this.time.delayedCall(16, () => sanityText.destroy());

        // Party label
        const partyLabel = this.add.text(320, barY, 'Party:', { fontFamily: 'Georgia', fontSize: '14px', color: '#3E2723' });
        this.time.delayedCall(16, () => partyLabel.destroy());

        // Party icons
        let iconX = 365;
        for (const member of this.party.members) {
            if (member.health > 0) {
                const iconColor = member.type === 'explorer' ? 0x4A6FA5 : member.type === 'scout' ? 0x8B4513 : 0x8B7355;
                this.graphics.fillStyle(iconColor);
                this.graphics.fillCircle(iconX, barY - 5, 8);

                for (let h = 0; h < member.maxHealth; h++) {
                    const dotColor = h < member.health ? COLORS.healthRed : 0x3A3A3A;
                    this.graphics.fillStyle(dotColor);
                    this.graphics.fillCircle(iconX - 6 + h * 6, barY + 10, 3);
                }
                iconX += 35;
            }
        }

        // Blessings/Curses
        if (this.party.blessings.length > 0 || this.party.curses.length > 0) {
            const blessText = this.add.text(95, barY + 25,
                `Blessings: ${this.party.blessings.length} | Curses: ${this.party.curses.length}`,
                { fontFamily: 'Georgia', fontSize: '12px', color: '#3E2723' });
            this.time.delayedCall(16, () => blessText.destroy());
        }
    }

    // Title screen
    drawTitleScreen() {
        // Background
        this.graphics.fillStyle(0x1A1A2E);
        this.graphics.fillRect(0, 0, 960, 640);

        // Frame
        this.graphics.fillStyle(COLORS.parchment);
        this.graphics.fillRect(200, 150, 560, 340);
        this.graphics.lineStyle(8, COLORS.leather);
        this.graphics.strokeRect(200, 150, 560, 340);
        this.graphics.lineStyle(2, COLORS.goldAccent);
        this.graphics.strokeRect(215, 165, 530, 310);

        // Title
        const title1 = this.add.text(480, 230, 'CURIOUS', { fontFamily: 'Georgia', fontSize: '48px', fontStyle: 'bold', color: '#3E2723' });
        title1.setOrigin(0.5, 0.5);
        const title2 = this.add.text(480, 290, 'EXPEDITION', { fontFamily: 'Georgia', fontSize: '48px', fontStyle: 'bold', color: '#3E2723' });
        title2.setOrigin(0.5, 0.5);
        const subtitle = this.add.text(480, 340, 'A Victorian Exploration Adventure', { fontFamily: 'Georgia', fontSize: '20px', fontStyle: 'italic', color: '#3E2723' });
        subtitle.setOrigin(0.5, 0.5);
        const instruction = this.add.text(480, 420, 'Click anywhere to begin your expedition', { fontFamily: 'Georgia', fontSize: '18px', color: '#3E2723' });
        instruction.setOrigin(0.5, 0.5);

        this.time.delayedCall(16, () => {
            title1.destroy();
            title2.destroy();
            subtitle.destroy();
            instruction.destroy();
        });
    }

    // Game over
    drawGameOver() {
        this.graphics.fillStyle(0x000000, 0.7);
        this.graphics.fillRect(520, 0, 440, 640);

        const gameOverText = this.add.text(740, 280, 'EXPEDITION FAILED', { fontFamily: 'Georgia', fontSize: '36px', fontStyle: 'bold', color: '#C62828' });
        gameOverText.setOrigin(0.5, 0.5);

        const statsText = this.add.text(740, 340,
            `Days: ${this.gameState.day}\nFame: ${this.gameState.fame}\nExpeditions: ${this.gameState.expedition}`,
            { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF', align: 'center' });
        statsText.setOrigin(0.5, 0.5);

        const retryText = this.add.text(740, 420, 'Click to try again', { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF' });
        retryText.setOrigin(0.5, 0.5);

        this.time.delayedCall(16, () => {
            gameOverText.destroy();
            statsText.destroy();
            retryText.destroy();
        });
    }

    // Victory
    drawVictory() {
        this.graphics.fillStyle(0x000000, 0.5);
        this.graphics.fillRect(520, 0, 440, 640);

        // Confetti particles
        if (Math.random() < 0.3) {
            const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
            this.addParticle(520 + Math.random() * 440, 50, colors[Math.floor(Math.random() * colors.length)], (Math.random() - 0.5) * 5, 2);
        }

        const victoryText = this.add.text(740, 250, 'PYRAMID FOUND!', { fontFamily: 'Georgia', fontSize: '36px', fontStyle: 'bold', color: '#DAA520' });
        victoryText.setOrigin(0.5, 0.5);

        const statsText = this.add.text(740, 330,
            `Days: ${this.gameState.day}\nFame Earned: 100\nTotal Fame: ${this.gameState.fame}\nExpeditions: ${this.gameState.completedExpeditions + 1}`,
            { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF', align: 'center' });
        statsText.setOrigin(0.5, 0.5);

        const nextText = this.add.text(740, 440, 'Click for next expedition', { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF' });
        nextText.setOrigin(0.5, 0.5);

        this.time.delayedCall(16, () => {
            victoryText.destroy();
            statsText.destroy();
            nextText.destroy();
        });
    }

    // Click handler
    handleClick(pointer) {
        const x = pointer.x;
        const y = pointer.y;

        if (this.gameState.state === 'title') {
            this.gameState.state = 'map';
            this.journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
            return;
        }

        if (this.gameState.state === 'event') {
            const startY = 320;
            const buttonWidth = 380;
            const buttonHeight = 40;
            const gap = 8;

            for (let i = 0; i < this.eventChoices.length; i++) {
                const by = startY + i * (buttonHeight + gap);
                if (x >= 95 && x <= 95 + buttonWidth && y >= by && y <= by + buttonHeight) {
                    this.handleChoice(i);
                    return;
                }
            }
            return;
        }

        if (this.gameState.state === 'map') {
            if (x > 520) {
                const neighbors = this.getNeighbors(this.party.x, this.party.y);
                const validMoves = neighbors.filter(n => {
                    if (n.x < 0 || n.x >= this.MAP_WIDTH || n.y < 0 || n.y >= this.MAP_HEIGHT) return false;
                    const terrain = this.TERRAIN_TYPES[this.hexMap[n.y][n.x]];
                    return terrain.passable;
                });

                if (validMoves.length > 0) {
                    validMoves.sort((a, b) => b.x - a.x);
                    this.moveParty(validMoves[0].x, validMoves[0].y);
                }
            }
        }

        if (this.gameState.state === 'victory' || this.gameState.state === 'gameOver') {
            if (this.gameState.state === 'victory') {
                this.gameState.completedExpeditions++;
                // Check achievements
                if (!ACHIEVEMENTS.firstPyramid.unlocked) {
                    ACHIEVEMENTS.firstPyramid.unlocked = true;
                    this.addFloatingText(480, 300, 'Achievement: Pyramid Found!', '#FFD700');
                }
                if (this.gameState.completedExpeditions >= 5 && !ACHIEVEMENTS.fiveExpeditions.unlocked) {
                    ACHIEVEMENTS.fiveExpeditions.unlocked = true;
                }
                if (this.party.sanity < 10 && !ACHIEVEMENTS.survivor.unlocked) {
                    ACHIEVEMENTS.survivor.unlocked = true;
                }
            }

            this.party.sanity = 100;
            this.party.members = [
                { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3, ability: 'leadership' },
                { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2, ability: 'pathfinding' },
                { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2, ability: 'carrying' }
            ];
            this.party.blessings = [];
            this.party.curses = [];
            this.party.inventory = ['Torch', 'Rope', 'Whiskey', 'Medicine'];
            this.gameState.day = 1;
            this.gameState.expedition++;
            this.pyramidFound = false;
            this.generateMap();
            this.revealFog(this.party.x, this.party.y);
            this.gameState.state = 'map';
            this.journalText = `Expedition ${this.gameState.expedition} begins! The search for glory continues.`;
            this.journalDay = this.gameState.day;
        }
    }

    handleMouseMove(pointer) {
        this.selectedChoice = -1;

        if (this.gameState.state === 'event') {
            const startY = 320;
            const buttonWidth = 380;
            const buttonHeight = 40;
            const gap = 8;

            for (let i = 0; i < this.eventChoices.length; i++) {
                const by = startY + i * (buttonHeight + gap);
                if (pointer.x >= 95 && pointer.x <= 95 + buttonWidth && pointer.y >= by && pointer.y <= by + buttonHeight) {
                    this.selectedChoice = i;
                    break;
                }
            }
        }
    }

    moveParty(toX, toY) {
        const terrain = this.TERRAIN_TYPES[this.hexMap[toY][toX]];
        let cost = terrain.cost + 3;

        // Weather effects
        if (this.weather === 'rainy') cost += 2;
        if (this.weather === 'foggy') cost += 1;

        // Curse effects
        if (this.party.curses.length > 0) cost += this.party.curses.length * 2;

        // Blessing effects
        if (this.party.blessings.includes('swift')) cost = Math.max(1, cost - 3);

        this.party.sanity = Math.max(0, this.party.sanity - cost);
        this.party.x = toX;
        this.party.y = toY;
        this.gameState.day++;
        this.journalDay = this.gameState.day;

        this.revealFog(toX, toY);

        // Random events
        if (terrain.name === 'Swamp' && Math.random() < 0.3) {
            this.triggerEvent('sickness');
            return;
        }

        const location = this.locations.find(l => l.x === toX && l.y === toY);
        if (location) {
            this.triggerEvent(location.type);
            return;
        }

        // Random encounter chances
        if (Math.random() < 0.08) {
            this.triggerEvent('animalAttack');
            return;
        }
        if (Math.random() < 0.06) {
            this.triggerEvent('nativeEncounter');
            return;
        }
        if (Math.random() < 0.05) {
            this.triggerEvent('treasure');
            return;
        }
        if (this.party.sanity < 30 && Math.random() < 0.2) {
            this.triggerEvent('lowSanity');
            return;
        }
        if (Math.random() < 0.12) {
            this.triggerEvent('nightCamp');
            return;
        }

        this.journalText = `Day ${this.gameState.day}. We traveled through the ${terrain.name.toLowerCase()}. The journey cost us ${cost} sanity.`;

        if (this.party.sanity <= 0) {
            const explorer = this.party.members.find(m => m.type === 'explorer');
            if (explorer) {
                explorer.health--;
                this.party.sanity = 20;
                this.journalText = 'Madness! The expedition leader collapsed from exhaustion. We barely managed to revive them.';
                this.triggerScreenShake(8);
                this.triggerScreenFlash(0xFF0000);

                if (explorer.health <= 0) {
                    this.gameState.state = 'gameOver';
                    this.journalText = 'The expedition has ended in tragedy. The explorer perished in the wilderness.';
                }
            }
        }
    }

    triggerEvent(eventType) {
        const eventData = this.EVENTS[eventType];
        if (eventData) {
            this.currentEvent = eventType;
            this.journalText = eventData.text;
            this.eventChoices = eventData.choices;
            this.gameState.state = 'event';
        }
    }

    handleChoice(choiceIndex) {
        const choice = this.eventChoices[choiceIndex];

        switch (choice.result) {
            case 'trade':
                this.journalText = 'We traded with the villagers. (+1 Torch)';
                this.party.inventory.push('Torch');
                this.addFloatingText(250, 400, '+Torch', '#00FF00');
                break;
            case 'rest':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 20);
                this.journalText = 'We rested in the village. (+20 Sanity)';
                this.addFloatingText(250, 400, '+20 Sanity', '#4A90B8');
                break;
            case 'hire':
                if (this.party.inventory.length > 0) {
                    this.party.inventory.pop();
                    this.party.members.push({ name: 'Guide', type: 'scout', health: 2, maxHealth: 2, ability: 'pathfinding' });
                    this.journalText = 'We hired a local guide.';
                    this.addFloatingText(250, 400, '+Guide', '#00FF00');
                } else {
                    this.journalText = 'We had nothing to trade.';
                }
                break;
            case 'investigate':
                if (Math.random() < 0.6) {
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 10);
                    this.journalText = 'The shrine contained ancient wisdom. (+10 Sanity)';
                    this.addFloatingText(250, 400, '+10 Sanity', '#4A90B8');
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 15);
                    this.journalText = 'The shrine was cursed! (-15 Sanity)';
                    this.addFloatingText(250, 400, '-15 Sanity', '#FF0000');
                    this.triggerScreenShake(5);
                }
                break;
            case 'offering':
                if (this.party.inventory.length > 0) {
                    this.party.inventory.pop();
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 30);
                    this.journalText = 'We made an offering. The spirits are pleased. (+30 Sanity)';
                    this.addFloatingText(250, 400, '+30 Sanity', '#4A90B8');
                } else {
                    this.journalText = 'We had nothing to offer.';
                }
                break;
            case 'bless':
                if (Math.random() < 0.5) {
                    this.party.blessings.push('swift');
                    this.journalText = 'The spirits granted us swiftness!';
                    this.addFloatingText(250, 400, '+Blessing', '#FFD700');
                    this.triggerScreenFlash(0xFFD700);
                } else {
                    this.party.curses.push('slowness');
                    this.journalText = 'The spirits cursed us for our arrogance!';
                    this.addFloatingText(250, 400, '+Curse', '#8B0000');
                    this.triggerScreenShake(5);
                }
                break;
            case 'enterPyramid':
                this.pyramidFound = true;
                this.gameState.fame += 100;
                this.gameState.state = 'victory';
                this.journalText = `SUCCESS! Fame earned: 100. Total Fame: ${this.gameState.fame}`;
                this.triggerScreenFlash(0xFFD700);
                return;
            case 'searchPyramid':
                if (Math.random() < 0.4) {
                    this.party.inventory.push('Artifact');
                    this.gameState.fame += 20;
                    this.journalText = 'Found an artifact! (+20 Fame)';
                    this.addFloatingText(250, 400, '+Artifact +20 Fame', '#FFD700');
                } else {
                    this.journalText = 'Found nothing of note.';
                }
                break;
            case 'exploreCave':
                if (Math.random() < 0.5) {
                    this.party.inventory.push('Gold Idol');
                    this.gameState.totalTreasures++;
                    this.journalText = 'Found a golden idol! (+Gold Idol)';
                    this.addFloatingText(250, 400, '+Gold Idol', '#FFD700');
                } else {
                    const member = this.party.members.find(m => m.health > 0 && m.type !== 'explorer');
                    if (member) {
                        member.health--;
                        this.journalText = `${member.name} was wounded in the darkness!`;
                        this.triggerScreenShake(5);
                        this.addFloatingText(250, 400, '-1 Health', '#FF0000');
                    } else {
                        this.party.sanity = Math.max(0, this.party.sanity - 20);
                        this.journalText = 'A creature attacked! (-20 Sanity)';
                        this.addFloatingText(250, 400, '-20 Sanity', '#FF0000');
                    }
                }
                break;
            case 'scoutCave':
                const scout = this.party.members.find(m => m.ability === 'pathfinding' && m.health > 0);
                if (scout) {
                    this.party.inventory.push('Treasure');
                    this.journalText = 'The scout found treasure safely! (+Treasure)';
                    this.addFloatingText(250, 400, '+Treasure', '#FFD700');
                } else {
                    this.journalText = 'No scout available. The cave remains unexplored.';
                }
                break;
            case 'oasisRest':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 30);
                this.journalText = 'The oasis restored us. (+30 Sanity)';
                this.addFloatingText(250, 400, '+30 Sanity', '#4A90B8');
                break;
            case 'fillWater':
                this.party.inventory.push('Water');
                this.journalText = 'Filled canteens. (+Water)';
                this.addFloatingText(250, 400, '+Water', '#00AAFF');
                break;
            case 'searchRuins':
                if (Math.random() < 0.6) {
                    this.party.inventory.push('Ancient Artifact');
                    this.gameState.fame += 30;
                    this.gameState.totalTreasures++;
                    this.journalText = 'Thorough search revealed an ancient artifact! (+30 Fame)';
                    this.addFloatingText(250, 400, '+Artifact +30 Fame', '#FFD700');
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 10);
                    this.journalText = 'The search exhausted us. (-10 Sanity)';
                    this.addFloatingText(250, 400, '-10 Sanity', '#FF0000');
                }
                break;
            case 'quickSearch':
                if (Math.random() < 0.3) {
                    this.party.inventory.push('Trinket');
                    this.journalText = 'Found a small trinket.';
                    this.addFloatingText(250, 400, '+Trinket', '#AAAAAA');
                } else {
                    this.journalText = 'Quick search revealed nothing.';
                }
                break;
            case 'buySupplies':
                if (this.gameState.fame >= 20) {
                    this.gameState.fame -= 20;
                    this.party.inventory.push('Medicine', 'Food', 'Torch');
                    this.journalText = 'Bought supplies. (-20 Fame)';
                    this.addFloatingText(250, 400, '+Supplies', '#00FF00');
                } else {
                    this.journalText = 'Not enough fame to trade.';
                }
                break;
            case 'sellTreasures':
                const treasures = this.party.inventory.filter(i => i.includes('Idol') || i.includes('Artifact') || i.includes('Treasure'));
                if (treasures.length > 0) {
                    this.party.inventory = this.party.inventory.filter(i => !i.includes('Idol') && !i.includes('Artifact') && !i.includes('Treasure'));
                    const fameGain = treasures.length * 25;
                    this.gameState.fame += fameGain;
                    this.journalText = `Sold treasures for +${fameGain} fame!`;
                    this.addFloatingText(250, 400, `+${fameGain} Fame`, '#FFD700');
                } else {
                    this.journalText = 'No treasures to sell.';
                }
                break;
            case 'tradingRest':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 25);
                this.journalText = 'Rested at the trading post. (+25 Sanity)';
                this.addFloatingText(250, 400, '+25 Sanity', '#4A90B8');
                break;
            case 'bathe':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 35);
                this.journalText = 'The cool water was incredibly refreshing. (+35 Sanity)';
                this.addFloatingText(250, 400, '+35 Sanity', '#4A90B8');
                break;
            case 'behindFalls':
                if (Math.random() < 0.4) {
                    this.party.inventory.push('Hidden Treasure');
                    this.gameState.totalTreasures++;
                    this.journalText = 'Found hidden treasure behind the waterfall!';
                    this.addFloatingText(250, 400, '+Hidden Treasure', '#FFD700');
                } else {
                    this.journalText = 'Nothing but rocks behind the falls.';
                }
                break;
            case 'campRest':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 15);
                this.gameState.day++;
                this.journalDay = this.gameState.day;
                this.journalText = 'Rested through the night. (+15 Sanity)';
                this.addFloatingText(250, 400, '+15 Sanity', '#4A90B8');
                break;
            case 'watch':
                this.journalText = 'We kept watch. The night passed uneventfully.';
                break;
            case 'stories':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 5);
                this.journalText = 'Sharing stories by the fire lifted our spirits. (+5 Sanity)';
                this.addFloatingText(250, 400, '+5 Sanity', '#4A90B8');
                break;
            case 'fightAnimal':
                if (Math.random() < 0.6) {
                    this.journalText = 'We fought off the beast!';
                    this.triggerScreenShake(5);
                } else {
                    const member = this.party.members.find(m => m.health > 0);
                    if (member) {
                        member.health--;
                        this.journalText = `${member.name} was injured in the fight!`;
                        this.addFloatingText(250, 400, '-1 Health', '#FF0000');
                        this.triggerScreenShake(8);
                    }
                }
                break;
            case 'fleeAnimal':
                this.party.sanity = Math.max(0, this.party.sanity - 10);
                this.journalText = 'We fled in terror! (-10 Sanity)';
                this.addFloatingText(250, 400, '-10 Sanity', '#FF0000');
                break;
            case 'distractAnimal':
                if (this.party.inventory.includes('Food')) {
                    this.party.inventory = this.party.inventory.filter(i => i !== 'Food');
                    this.journalText = 'Distracted the beast with food.';
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 5);
                    this.journalText = 'No food! The beast chased us briefly. (-5 Sanity)';
                }
                break;
            case 'giftNatives':
                if (this.party.inventory.length > 0) {
                    this.party.inventory.pop();
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 15);
                    this.journalText = 'The natives accepted our gift warmly. (+15 Sanity)';
                    this.addFloatingText(250, 400, '+15 Sanity', '#4A90B8');
                } else {
                    this.journalText = 'We had nothing to give.';
                }
                break;
            case 'communicateNatives':
                const translator = this.party.members.find(m => m.type === 'scout' && m.health > 0);
                if (translator) {
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 20);
                    this.journalText = 'Our scout translated! Friendly exchange. (+20 Sanity)';
                    this.addFloatingText(250, 400, '+20 Sanity', '#4A90B8');
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 10);
                    this.journalText = 'Failed to communicate. Tensions rose. (-10 Sanity)';
                    this.addFloatingText(250, 400, '-10 Sanity', '#FF0000');
                }
                break;
            case 'retreatNatives':
                this.journalText = 'We slowly backed away. Crisis averted.';
                break;
            case 'digTreasure':
                this.party.inventory.push('Buried Gold');
                this.gameState.totalTreasures++;
                this.gameState.fame += 15;
                this.journalText = 'Dug up buried gold! (+15 Fame)';
                this.addFloatingText(250, 400, '+Gold +15 Fame', '#FFD700');
                break;
            case 'checkTraps':
                if (Math.random() < 0.3) {
                    this.journalText = 'Found and disarmed a trap! Safe to dig.';
                    this.party.inventory.push('Safe Treasure');
                    this.gameState.totalTreasures++;
                } else {
                    this.journalText = 'No traps found.';
                    this.party.inventory.push('Treasure');
                    this.gameState.totalTreasures++;
                }
                this.addFloatingText(250, 400, '+Treasure', '#FFD700');
                break;
            case 'useMedicine':
                if (this.party.inventory.includes('Medicine')) {
                    this.party.inventory = this.party.inventory.filter(i => i !== 'Medicine');
                    this.journalText = 'Used medicine. The illness is cured!';
                    this.addFloatingText(250, 400, 'Cured!', '#00FF00');
                } else {
                    const sick = this.party.members.find(m => m.health > 0 && m.type !== 'explorer');
                    if (sick) {
                        sick.health--;
                        this.journalText = 'No medicine! The illness worsened.';
                        this.addFloatingText(250, 400, '-1 Health', '#FF0000');
                    }
                }
                break;
            case 'restSick':
                this.gameState.day++;
                if (Math.random() < 0.5) {
                    this.journalText = 'Rest helped! Feeling better.';
                } else {
                    const sick = this.party.members.find(m => m.health > 0 && m.type !== 'explorer');
                    if (sick) sick.health--;
                    this.journalText = 'Rest was not enough. Condition worsened.';
                }
                break;
            case 'pressOn':
                this.party.sanity = Math.max(0, this.party.sanity - 15);
                this.journalText = 'We pressed on despite illness. (-15 Sanity)';
                this.addFloatingText(250, 400, '-15 Sanity', '#FF0000');
                break;
            case 'enterPortal':
                const newX = Math.floor(Math.random() * (this.MAP_WIDTH - 4)) + 2;
                const newY = Math.floor(Math.random() * (this.MAP_HEIGHT - 2)) + 1;
                this.party.x = newX;
                this.party.y = newY;
                this.party.sanity = Math.max(0, this.party.sanity - 20);
                this.revealFog(newX, newY);
                this.journalText = 'The portal transported us! (-20 Sanity)';
                this.triggerScreenFlash(0x8A4FFF);
                this.addFloatingText(250, 400, '-20 Sanity', '#8A4FFF');
                break;
            case 'studyPortal':
                if (Math.random() < 0.5) {
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 10);
                    this.journalText = 'Gained mystical knowledge! (+10 Sanity)';
                    this.addFloatingText(250, 400, '+10 Sanity', '#8A4FFF');
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 10);
                    this.journalText = 'The energies burned our minds! (-10 Sanity)';
                    this.addFloatingText(250, 400, '-10 Sanity', '#FF0000');
                }
                break;
            case 'sanityBreak':
                this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 10);
                this.gameState.day++;
                this.journalText = 'We took time to rest our minds. (+10 Sanity)';
                this.addFloatingText(250, 400, '+10 Sanity', '#4A90B8');
                break;
            case 'drinkWhiskey':
                if (this.party.inventory.includes('Whiskey')) {
                    this.party.inventory = this.party.inventory.filter(i => i !== 'Whiskey');
                    this.party.sanity = Math.min(this.party.maxSanity, this.party.sanity + 25);
                    this.journalText = 'The whiskey calmed our nerves. (+25 Sanity)';
                    this.addFloatingText(250, 400, '+25 Sanity', '#DAA520');
                } else {
                    this.journalText = 'No whiskey left!';
                }
                break;
            case 'pushThrough':
                if (Math.random() < 0.5) {
                    this.journalText = 'We steeled our resolve and pushed on.';
                } else {
                    this.party.sanity = Math.max(0, this.party.sanity - 15);
                    this.journalText = 'The strain was too much! (-15 Sanity)';
                    this.addFloatingText(250, 400, '-15 Sanity', '#FF0000');
                    this.triggerScreenShake(5);
                }
                break;
            case 'leave':
            default:
                this.journalText = `Day ${this.gameState.day}. We moved on.`;
                break;
        }

        // Check for treasure hunter achievement
        if (this.gameState.totalTreasures >= 10 && !ACHIEVEMENTS.treasureHunter.unlocked) {
            ACHIEVEMENTS.treasureHunter.unlocked = true;
            this.addFloatingText(480, 100, 'Achievement: Treasure Hunter!', '#FFD700');
        }

        this.eventChoices = [];
        this.currentEvent = null;
        this.gameState.state = 'map';
    }
}

// Initialize game
const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
