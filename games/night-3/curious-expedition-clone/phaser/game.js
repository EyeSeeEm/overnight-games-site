// Curious Expedition Clone - Phaser Version
const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

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
    daySky: 0x6BC5D2,
    nightSky: 0x1A1A3E,
    sanityBlue: 0x4A90B8,
    healthRed: 0xB85450,
    fogOfWar: 0x2A2A4A
};

// Game State
let gameState = {
    state: 'title',
    day: 1,
    expedition: 1,
    fame: 0
};

// Party
let party = {
    sanity: 100,
    maxSanity: 100,
    members: [
        { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3 },
        { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2 },
        { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2 }
    ],
    inventory: ['Torch', 'Rope', 'Whiskey'],
    x: 0,
    y: 0
};

// Map Configuration
const MAP_WIDTH = 12;
const MAP_HEIGHT = 10;

// Terrain Types
const TERRAIN_TYPES = {
    grass: { cost: 2, passable: true, name: 'Grassland' },
    jungle: { cost: 5, passable: true, name: 'Light Jungle' },
    thickJungle: { cost: 10, passable: true, name: 'Thick Jungle' },
    desert: { cost: 8, passable: true, name: 'Desert' },
    water: { cost: 0, passable: false, name: 'Deep Water' },
    mountain: { cost: 0, passable: false, name: 'Mountain' }
};

// Map Data
let hexMap = [];
let locations = [];
let fogOfWar = [];
let pyramidFound = false;

// Event System
let currentEvent = null;
let eventChoices = [];
let selectedChoice = -1;

// Journal text
let journalText = '';
let journalDay = 1;

// Events Database
const EVENTS = {
    village: {
        title: 'Native Village',
        text: 'We entered a native village of a warrior tribe. The villagers had been awaiting us. They seemed to know about us already. They were cautious, but politely offered their help.',
        choices: [
            { text: 'Trade', result: 'trade' },
            { text: 'Rest (+20 Sanity)', result: 'rest' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    shrine: {
        title: 'Ancient Shrine',
        text: 'We discovered an ancient shrine covered in strange symbols. The air feels heavy with mystical energy. Our native scout warns us to be careful.',
        choices: [
            { text: 'Investigate', result: 'investigate' },
            { text: 'Make an offering', result: 'offering' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    pyramid: {
        title: 'The Golden Pyramid',
        text: 'There was the golden pyramid, enthroned above the landscape. I found the goal of my journey!',
        choices: [
            { text: 'Enter the pyramid', result: 'enterPyramid' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    cave: {
        title: 'Dark Cave',
        text: 'A dark cave entrance looms before us. Strange sounds echo from within. There could be treasures... or dangers.',
        choices: [
            { text: 'Explore with torch', result: 'exploreCave' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    oasis: {
        title: 'Desert Oasis',
        text: 'We stumbled upon a beautiful oasis. Crystal clear water and shade from palm trees. A perfect place to rest.',
        choices: [
            { text: 'Rest (+30 Sanity)', result: 'oasisRest' },
            { text: 'Fill canteens', result: 'fillWater' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    nightCamp: {
        title: 'Night Camp',
        text: 'I decided it would be a good idea to stay here and allowed everyone to rest. The night was bleak and everyone was seemingly worn out as we sat by the fire.',
        choices: [
            { text: 'Rest until dawn (+15 Sanity)', result: 'campRest' },
            { text: 'Keep watch', result: 'watch' }
        ]
    }
};

// Phaser scene variables
let graphics;
let scene;

function preload() {
    // No assets to preload - we'll draw everything
}

function create() {
    scene = this;
    graphics = this.add.graphics();

    generateMap();
    revealFog(party.x, party.y);
    journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
    journalDay = gameState.day;

    // Input handling
    this.input.on('pointerdown', handleClick);
    this.input.on('pointermove', handleMouseMove);
}

function update() {
    graphics.clear();

    if (gameState.state === 'title') {
        drawTitleScreen();
    } else {
        drawMap();
        drawJournal();

        if (gameState.state === 'gameOver') {
            drawGameOver();
        } else if (gameState.state === 'victory') {
            drawVictory();
        }
    }
}

// Generate hex map
function generateMap() {
    hexMap = [];
    locations = [];
    fogOfWar = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        hexMap[y] = [];
        fogOfWar[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const rand = Math.random();
            let terrain;
            if (rand < 0.35) terrain = 'grass';
            else if (rand < 0.55) terrain = 'jungle';
            else if (rand < 0.70) terrain = 'thickJungle';
            else if (rand < 0.80) terrain = 'desert';
            else if (rand < 0.90) terrain = 'water';
            else terrain = 'mountain';

            hexMap[y][x] = terrain;
            fogOfWar[y][x] = true;
        }
    }

    party.x = 1;
    party.y = Math.floor(MAP_HEIGHT / 2);
    hexMap[party.y][party.x] = 'grass';
    hexMap[party.y][party.x + 1] = 'grass';

    const pyramidX = MAP_WIDTH - 2;
    const pyramidY = Math.floor(MAP_HEIGHT / 2) + Math.floor(Math.random() * 3) - 1;
    locations.push({ x: pyramidX, y: pyramidY, type: 'pyramid' });
    hexMap[pyramidY][pyramidX] = 'grass';

    for (let i = 0; i < 3; i++) placeLocation('village');
    for (let i = 0; i < 2; i++) placeLocation('shrine');
    placeLocation('cave');
    placeLocation('oasis');
}

function placeLocation(type) {
    let attempts = 0;
    while (attempts < 50) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

        let valid = true;
        for (const loc of locations) {
            const dist = Math.abs(loc.x - x) + Math.abs(loc.y - y);
            if (dist < 3) {
                valid = false;
                break;
            }
        }

        if (valid && hexMap[y][x] !== 'water' && hexMap[y][x] !== 'mountain') {
            locations.push({ x, y, type });
            hexMap[y][x] = 'grass';
            break;
        }
        attempts++;
    }
}

function revealFog(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                if (Math.abs(dx) + Math.abs(dy) <= 3) {
                    fogOfWar[ny][nx] = false;
                }
            }
        }
    }
}

function getNeighbors(x, y) {
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
function drawMap() {
    const isNight = gameState.day % 5 === 0;

    if (gameState.state === 'event' && currentEvent) {
        drawEventScene(currentEvent, isNight);
    } else {
        drawExplorationScene(isNight);
    }
}

function drawEventScene(eventType, isNight) {
    const x = 520;

    switch(eventType) {
        case 'village':
            drawVillageScene(x, isNight);
            break;
        case 'shrine':
            drawShrineScene(x, isNight);
            break;
        case 'pyramid':
            drawPyramidScene(x, isNight);
            break;
        case 'cave':
            drawCaveScene(x, isNight);
            break;
        case 'oasis':
            drawOasisScene(x, isNight);
            break;
        case 'nightCamp':
            drawCampScene(x);
            break;
        default:
            drawJungleScene(x, isNight);
    }
}

function drawExplorationScene(isNight) {
    const x = 520;
    drawJungleScene(x, isNight);
    drawMiniMap(x + 20, 20);
}

function drawVillageScene(x, isNight) {
    // Sky
    graphics.fillStyle(isNight ? 0x1A1A3E : 0x4ECDC4);
    graphics.fillRect(x, 0, 440, 640);

    // Background mountains
    graphics.fillStyle(isNight ? 0x1A3A2A : 0x3E8B4E);
    drawMountainRange(x, 80, 440, 100);

    // Trees
    const treeColor = isNight ? 0x1A4A2A : 0x2E7D32;
    for (let i = 0; i < 10; i++) {
        drawTree(x + 30 + i * 45, 150 + Math.sin(i) * 20, 40 + Math.random() * 20, treeColor);
    }

    // Ground
    graphics.fillStyle(isNight ? 0x2A4A2A : 0x5A8F3E);
    graphics.fillRect(x, 350, 440, 290);

    // Grass texture
    graphics.fillStyle(isNight ? 0x3A5A3A : 0x6BA34E);
    for (let i = 0; i < 50; i++) {
        graphics.fillRect(x + Math.random() * 440, 360 + Math.random() * 200, 3, 8);
    }

    // Huts
    drawHut(x + 120, 320, 80, 70);
    drawHut(x + 250, 300, 100, 90);
    drawHut(x + 350, 340, 70, 60);

    // Fence
    graphics.fillStyle(0x5D4037);
    for (let i = 0; i < 12; i++) {
        graphics.fillRect(x + 300 + i * 12, 480, 6, 40);
        graphics.fillRect(x + 300 + i * 12, 470, 6, 15);
    }

    // Villagers
    drawPixelPerson(x + 180, 420, 0x8B4513, 0xB85450);
    drawPixelPerson(x + 280, 440, 0x6B3A0A, 0x4A90B8);
    drawPixelPerson(x + 350, 430, 0x8B4513, 0xC4A35A);

    // Party
    drawExplorerSprite(x + 220, 450);
    drawDonkeySprite(x + 260, 460);

    // Speech bubble
    graphics.fillStyle(0xFFFFFF);
    graphics.fillEllipse(x + 280, 400, 200, 50);
}

function drawPyramidScene(x, isNight) {
    // Sky
    graphics.fillStyle(0x4ECDC4);
    graphics.fillRect(x, 0, 440, 640);

    // Clouds
    graphics.fillStyle(0xFFFFFF);
    drawCloud(x + 80, 60, 50);
    drawCloud(x + 280, 40, 40);
    drawCloud(x + 380, 80, 35);

    // Mountains
    graphics.fillStyle(0x5A8A6E);
    drawMountainRange(x, 150, 440, 80);

    // Trees behind pyramid
    for (let i = 0; i < 15; i++) {
        drawTree(x + 20 + i * 30, 200 + Math.sin(i * 0.8) * 30, 50, 0x2E7D32);
    }

    // Golden Pyramid
    drawGoldenPyramid(x + 220, 120, 200, 250);

    // Ground
    graphics.fillStyle(0x5A8F3E);
    graphics.fillRect(x, 500, 440, 140);

    // Path
    graphics.fillStyle(0x7A8A5A);
    graphics.beginPath();
    graphics.moveTo(x + 180, 640);
    graphics.lineTo(x + 260, 640);
    graphics.lineTo(x + 235, 500);
    graphics.lineTo(x + 205, 500);
    graphics.closePath();
    graphics.fillPath();

    // Foreground trees
    drawTree(x + 50, 480, 60, 0x1B5E20);
    drawTree(x + 380, 470, 70, 0x1B5E20);

    // Party
    drawExplorerSprite(x + 200, 560);
    drawDonkeySprite(x + 160, 570);
}

function drawCampScene(x) {
    // Night sky
    graphics.fillStyle(0x0D0D1A);
    graphics.fillRect(x, 0, 440, 320);
    graphics.fillStyle(0x1A2A2A);
    graphics.fillRect(x, 320, 440, 320);

    // Stars
    graphics.fillStyle(0xFFFFFF);
    for (let i = 0; i < 50; i++) {
        graphics.fillRect(x + Math.random() * 440, Math.random() * 300, Math.random() < 0.1 ? 3 : 1, Math.random() < 0.1 ? 3 : 1);
    }

    // Moon
    graphics.fillStyle(0xE8E8D0);
    graphics.fillCircle(x + 350, 80, 25);
    graphics.fillStyle(0x0D0D1A);
    graphics.fillCircle(x + 340, 75, 22);

    // Tree silhouettes
    graphics.fillStyle(0x0A1520);
    for (let i = 0; i < 8; i++) {
        drawTreeSilhouette(x + 30 + i * 55, 280, 80 + Math.random() * 40);
    }

    // Campfire glow
    graphics.fillStyle(0xFF9632, 0.3);
    graphics.fillCircle(x + 220, 480, 100);

    // Campfire
    drawCampfire(x + 220, 480);

    // Party around fire
    drawExplorerSprite(x + 150, 470);
    drawPixelPerson(x + 280, 465, 0x8B4513, 0x4A6FA5);
    drawDonkeySprite(x + 320, 450);
}

function drawShrineScene(x, isNight) {
    // Background
    graphics.fillStyle(isNight ? 0x1A1A3E : 0x6BCFC4);
    graphics.fillRect(x, 0, 440, 640);

    // Forest
    const shrineTreeColor = isNight ? 0x1A3A2A : 0x2E6D32;
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 150, 70, shrineTreeColor);
    }

    // Ground
    graphics.fillStyle(isNight ? 0x2A3A2A : 0x4A7A4E);
    graphics.fillRect(x, 380, 440, 260);

    // Shrine
    drawStoneShrine(x + 220, 300);

    // Glow
    graphics.fillStyle(0xDAA520, 0.3);
    graphics.fillCircle(x + 220, 350, 80);

    // Party
    drawExplorerSprite(x + 150, 480);
    drawDonkeySprite(x + 100, 490);
}

function drawCaveScene(x, isNight) {
    // Dark background
    graphics.fillStyle(0x1A1A1A);
    graphics.fillRect(x, 0, 440, 640);

    // Cave walls
    graphics.fillStyle(0x3A3A3A);
    graphics.beginPath();
    graphics.moveTo(x, 0);
    graphics.lineTo(x + 120, 0);
    graphics.lineTo(x + 80, 200);
    graphics.lineTo(x + 60, 640);
    graphics.lineTo(x, 640);
    graphics.closePath();
    graphics.fillPath();

    graphics.beginPath();
    graphics.moveTo(x + 440, 0);
    graphics.lineTo(x + 320, 0);
    graphics.lineTo(x + 360, 200);
    graphics.lineTo(x + 380, 640);
    graphics.lineTo(x + 440, 640);
    graphics.closePath();
    graphics.fillPath();

    // Stalactites
    graphics.fillStyle(0x4A4A4A);
    for (let i = 0; i < 8; i++) {
        const sx = x + 100 + i * 35;
        const sh = 30 + Math.random() * 50;
        graphics.fillTriangle(sx - 10, 0, sx, sh, sx + 10, 0);
    }

    // Torch glow
    graphics.fillStyle(0xFF9632, 0.4);
    graphics.fillCircle(x + 180, 430, 100);

    // Explorer with torch
    drawExplorerSprite(x + 180, 450);

    // Torch flame
    graphics.fillStyle(0xFF9932);
    graphics.fillEllipse(x + 195, 430, 16, 30);
}

function drawOasisScene(x, isNight) {
    // Desert sky gradient
    graphics.fillStyle(0x87CEEB);
    graphics.fillRect(x, 0, 440, 200);
    graphics.fillStyle(0xF4D03F);
    graphics.fillRect(x, 200, 440, 200);
    graphics.fillStyle(0xD4A559);
    graphics.fillRect(x, 400, 440, 240);

    // Sand dunes
    graphics.fillStyle(0xD4A559);
    graphics.beginPath();
    graphics.moveTo(x, 300);
    graphics.lineTo(x + 100, 250);
    graphics.lineTo(x + 200, 300);
    graphics.lineTo(x + 300, 350);
    graphics.lineTo(x + 440, 280);
    graphics.lineTo(x + 440, 640);
    graphics.lineTo(x, 640);
    graphics.closePath();
    graphics.fillPath();

    // Oasis water
    graphics.fillStyle(0x4ECDC4);
    graphics.fillEllipse(x + 220, 450, 200, 100);
    graphics.fillStyle(0x3DBDB4);
    graphics.fillEllipse(x + 220, 470, 160, 60);

    // Palm trees
    drawPalmTree(x + 150, 380, 80);
    drawPalmTree(x + 280, 370, 90);
    drawPalmTree(x + 320, 400, 60);

    // Party
    drawExplorerSprite(x + 200, 500);
    drawDonkeySprite(x + 250, 510);
}

function drawJungleScene(x, isNight) {
    // Sky
    graphics.fillStyle(isNight ? 0x1A1A3E : 0x4ECDC4);
    graphics.fillRect(x, 0, 440, 640);

    // Background trees
    const bgColor = isNight ? 0x1A3A2A : 0x3E8B4E;
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 120 + Math.sin(i) * 30, 60, bgColor);
    }

    // Mid trees
    const midColor = isNight ? 0x1A4A2A : 0x2E7D32;
    for (let i = 0; i < 10; i++) {
        drawTree(x + 10 + i * 45, 200 + Math.cos(i) * 20, 70, midColor);
    }

    // Ground
    graphics.fillStyle(isNight ? 0x1A3A2A : 0x4A8A4E);
    graphics.fillRect(x, 400, 440, 240);

    // Foreground trees
    const fgColor = isNight ? 0x0A2A1A : 0x1B5E20;
    for (let i = 0; i < 6; i++) {
        drawTree(x + i * 80, 500, 100, fgColor);
    }

    // Party
    drawExplorerSprite(x + 220, 480);
    drawDonkeySprite(x + 180, 490);
}

// Helper drawing functions
function drawTree(x, y, height, color) {
    // Trunk
    graphics.fillStyle(0x5D4037);
    graphics.fillRect(x - 5, y, 10, height * 0.3);

    // Foliage
    graphics.fillStyle(color);
    for (let i = 0; i < 3; i++) {
        graphics.fillCircle(x, y - height * 0.2 - i * height * 0.2, height * 0.3 - i * 5);
    }
}

function drawTreeSilhouette(x, y, height) {
    graphics.fillTriangle(x - height * 0.4, y, x, y - height, x + height * 0.4, y);
}

function drawMountainRange(x, y, width, height) {
    graphics.beginPath();
    graphics.moveTo(x, y + height);
    for (let i = 0; i <= width; i += 40) {
        const peakHeight = height * (0.5 + Math.sin(i * 0.05) * 0.5);
        graphics.lineTo(x + i, y + height - peakHeight);
    }
    graphics.lineTo(x + width, y + height);
    graphics.closePath();
    graphics.fillPath();
}

function drawCloud(x, y, size) {
    graphics.fillCircle(x, y, size);
    graphics.fillCircle(x + size * 0.8, y - size * 0.2, size * 0.7);
    graphics.fillCircle(x + size * 1.4, y, size * 0.6);
}

function drawHut(x, y, width, height) {
    // Roof
    graphics.fillStyle(0xC4A35A);
    graphics.fillTriangle(x + width / 2, y - height * 0.4, x - width * 0.1, y + height * 0.3, x + width * 1.1, y + height * 0.3);

    // Walls
    graphics.fillStyle(0x8B6914);
    graphics.fillRect(x, y + height * 0.3, width, height * 0.5);

    // Door
    graphics.fillStyle(0x3E2723);
    graphics.fillRect(x + width * 0.4, y + height * 0.45, width * 0.2, height * 0.35);
}

function drawGoldenPyramid(x, y, width, height) {
    // Main body
    graphics.fillStyle(0xDAA520);
    graphics.fillTriangle(x, y, x - width / 2, y + height, x + width / 2, y + height);

    // Shading
    graphics.fillStyle(0xB8860B);
    graphics.fillTriangle(x, y, x + width / 2, y + height, x, y + height);

    // Entrance
    graphics.fillStyle(0x2A1A0A);
    graphics.fillTriangle(x, y + height * 0.6, x - width * 0.08, y + height, x + width * 0.08, y + height);

    // Glow
    graphics.fillStyle(0xFFD700);
    graphics.fillCircle(x, y + 20, 15);
}

function drawStoneShrine(x, y) {
    // Base
    graphics.fillStyle(0x6A6A5A);
    graphics.fillRect(x - 60, y + 60, 120, 30);

    // Pillars
    graphics.fillStyle(0x7A7A6A);
    graphics.fillRect(x - 50, y - 20, 20, 80);
    graphics.fillRect(x + 30, y - 20, 20, 80);

    // Top
    graphics.fillRect(x - 55, y - 35, 110, 20);

    // Altar
    graphics.fillStyle(0x5A5A4A);
    graphics.fillRect(x - 20, y + 20, 40, 40);

    // Artifact
    graphics.fillStyle(0xDAA520);
    graphics.fillCircle(x, y + 30, 12);
}

function drawPalmTree(x, y, height) {
    // Trunk
    graphics.fillStyle(0x8B6914);
    graphics.fillRect(x - 6, y, 12, height);

    // Fronds
    graphics.fillStyle(0x2E7D32);
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        graphics.fillEllipse(x + Math.cos(angle) * 20, y - 10 + Math.sin(angle) * 10, 16, 40);
    }
}

function drawCampfire(x, y) {
    // Logs
    graphics.fillStyle(0x5D4037);
    graphics.fillRect(x - 25, y + 5, 50, 10);

    // Fire
    graphics.fillStyle(0xFF6B35);
    graphics.beginPath();
    graphics.moveTo(x - 15, y + 5);
    graphics.lineTo(x, y - 45);
    graphics.lineTo(x + 15, y + 5);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0xFFD93D);
    graphics.beginPath();
    graphics.moveTo(x - 8, y + 5);
    graphics.lineTo(x, y - 30);
    graphics.lineTo(x + 8, y + 5);
    graphics.closePath();
    graphics.fillPath();
}

function drawPixelPerson(x, y, skinColor, clothColor) {
    graphics.fillStyle(skinColor);
    graphics.fillRect(x - 4, y - 20, 8, 8);
    graphics.fillStyle(clothColor);
    graphics.fillRect(x - 5, y - 12, 10, 12);
    graphics.fillStyle(skinColor);
    graphics.fillRect(x - 4, y, 3, 8);
    graphics.fillRect(x + 1, y, 3, 8);
}

function drawExplorerSprite(x, y) {
    // Hat
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(x - 10, y - 28, 20, 4);
    graphics.fillRect(x - 6, y - 35, 12, 8);
    // Head
    graphics.fillStyle(0xE8B89D);
    graphics.fillRect(x - 5, y - 24, 10, 10);
    // Body
    graphics.fillStyle(0x4A6FA5);
    graphics.fillRect(x - 6, y - 14, 12, 14);
    // Legs
    graphics.fillStyle(0xC4A35A);
    graphics.fillRect(x - 5, y, 4, 10);
    graphics.fillRect(x + 1, y, 4, 10);
    // Boots
    graphics.fillStyle(0x3E2723);
    graphics.fillRect(x - 5, y + 8, 4, 4);
    graphics.fillRect(x + 1, y + 8, 4, 4);
}

function drawDonkeySprite(x, y) {
    // Body
    graphics.fillStyle(0x8B7355);
    graphics.fillRect(x - 12, y - 8, 24, 14);
    graphics.fillRect(x - 18, y - 12, 10, 10);
    // Ears
    graphics.fillRect(x - 18, y - 18, 3, 8);
    graphics.fillRect(x - 12, y - 18, 3, 8);
    // Legs
    graphics.fillRect(x - 10, y + 6, 4, 10);
    graphics.fillRect(x + 6, y + 6, 4, 10);
    // Cargo
    graphics.fillStyle(0x5D4037);
    graphics.fillRect(x - 8, y - 14, 16, 8);
}

function drawMiniMap(x, y) {
    const miniSize = 6;
    const padding = 8;
    const mapW = MAP_WIDTH * miniSize + padding * 2;
    const mapH = MAP_HEIGHT * miniSize + padding * 2;

    // Background
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(x, y, mapW, mapH);

    // Border
    graphics.lineStyle(2, 0xDAA520);
    graphics.strokeRect(x, y, mapW, mapH);

    // Terrain
    for (let my = 0; my < MAP_HEIGHT; my++) {
        for (let mx = 0; mx < MAP_WIDTH; mx++) {
            const px = x + padding + mx * miniSize;
            const py = y + padding + my * miniSize;

            if (fogOfWar[my][mx]) {
                graphics.fillStyle(0x2A2A4A);
            } else {
                const terrain = hexMap[my][mx];
                const colors = { grass: 0x5A8F3E, jungle: 0x2E7D32, thickJungle: 0x1B5E20, desert: 0xD4A559, water: 0x2E6B8A, mountain: 0x6B5B4F };
                graphics.fillStyle(colors[terrain] || 0x5A8F3E);
            }
            graphics.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
    }

    // Locations
    for (const loc of locations) {
        if (!fogOfWar[loc.y][loc.x]) {
            const px = x + padding + loc.x * miniSize;
            const py = y + padding + loc.y * miniSize;
            graphics.fillStyle(loc.type === 'pyramid' ? 0xFFD700 : 0xFFFFFF);
            graphics.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
    }

    // Party
    graphics.fillStyle(0xFF0000);
    graphics.fillRect(x + padding + party.x * miniSize, y + padding + party.y * miniSize, miniSize - 1, miniSize - 1);
}

// Draw journal (left panel)
function drawJournal() {
    // Leather binding
    graphics.fillStyle(COLORS.leatherDark);
    graphics.fillRect(40, 40, 25, 560);
    graphics.fillStyle(COLORS.leather);
    graphics.fillRect(50, 45, 15, 550);

    // Parchment
    graphics.fillStyle(COLORS.parchment);
    graphics.fillRect(65, 50, 435, 540);

    // Border
    graphics.lineStyle(2, COLORS.inkBrown);
    graphics.strokeRect(75, 60, 415, 520);

    // Clasps
    graphics.fillStyle(0x8A8A7A);
    graphics.fillRect(495, 150, 12, 25);
    graphics.fillRect(495, 400, 12, 25);

    // Day header
    const dayText = scene.add.text(282, 85, `Day ${journalDay}`, { fontFamily: 'Georgia', fontSize: '24px', fontStyle: 'italic', color: '#3E2723' });
    dayText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => dayText.destroy());

    // Journal text
    const journalTextObj = scene.add.text(95, 130, journalText, { fontFamily: 'Georgia', fontSize: '16px', color: '#3E2723', wordWrap: { width: 380 } });
    scene.time.delayedCall(16, () => journalTextObj.destroy());

    // Draw choices if in event
    if (gameState.state === 'event' && eventChoices.length > 0) {
        drawEventChoices();
    }

    // Status bar
    drawStatusBar();
}

function drawEventChoices() {
    const startY = 350;
    const buttonWidth = 380;
    const buttonHeight = 45;
    const gap = 12;

    for (let i = 0; i < eventChoices.length; i++) {
        const y = startY + i * (buttonHeight + gap);
        const isHovered = selectedChoice === i;

        // Button bg
        graphics.fillStyle(isHovered ? 0x5A4738 : COLORS.buttonBg);
        graphics.fillRect(95, y, buttonWidth, buttonHeight);

        // Corners
        graphics.lineStyle(2, COLORS.goldAccent);
        drawCorner(95, y, 12, false, false);
        drawCorner(95 + buttonWidth, y, 12, true, false);
        drawCorner(95, y + buttonHeight, 12, false, true);
        drawCorner(95 + buttonWidth, y + buttonHeight, 12, true, true);

        // Text
        const choiceText = scene.add.text(115, y + 23, `${i + 1}. ${eventChoices[i].text}`, { fontFamily: 'Georgia', fontSize: '18px', color: '#F5E6D3' });
        choiceText.setOrigin(0, 0.5);
        scene.time.delayedCall(16, () => choiceText.destroy());
    }
}

function drawCorner(x, y, size, flipX, flipY) {
    const dx = flipX ? -1 : 1;
    const dy = flipY ? -1 : 1;

    graphics.beginPath();
    graphics.moveTo(x, y + dy * size);
    graphics.lineTo(x, y);
    graphics.lineTo(x + dx * size, y);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(x + dx * 4, y + dy * (size - 4));
    graphics.lineTo(x + dx * 4, y + dy * 4);
    graphics.lineTo(x + dx * (size - 4), y + dy * 4);
    graphics.strokePath();
}

function drawStatusBar() {
    const barY = 545;

    // Sanity label
    const sanityLabel = scene.add.text(95, barY, 'Sanity:', { fontFamily: 'Georgia', fontSize: '14px', color: '#3E2723' });
    scene.time.delayedCall(16, () => sanityLabel.destroy());

    // Bar bg
    graphics.fillStyle(0x3A3A3A);
    graphics.fillRect(150, barY - 12, 150, 16);

    // Bar fill
    const sanityPercent = party.sanity / party.maxSanity;
    const barColor = sanityPercent > 0.5 ? COLORS.sanityBlue : sanityPercent > 0.25 ? 0xD4A559 : COLORS.dangerRed;
    graphics.fillStyle(barColor);
    graphics.fillRect(150, barY - 12, 150 * sanityPercent, 16);

    // Sanity text
    const sanityText = scene.add.text(225, barY - 4, `${party.sanity}/${party.maxSanity}`, { fontFamily: 'Georgia', fontSize: '12px', color: '#FFFFFF' });
    sanityText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => sanityText.destroy());

    // Party label
    const partyLabel = scene.add.text(320, barY, 'Party:', { fontFamily: 'Georgia', fontSize: '14px', color: '#3E2723' });
    scene.time.delayedCall(16, () => partyLabel.destroy());

    // Party icons
    let iconX = 365;
    for (const member of party.members) {
        if (member.health > 0) {
            const iconColor = member.type === 'explorer' ? 0x4A6FA5 : member.type === 'scout' ? 0x8B4513 : 0x8B7355;
            graphics.fillStyle(iconColor);
            graphics.fillCircle(iconX, barY - 5, 8);

            for (let h = 0; h < member.maxHealth; h++) {
                graphics.fillStyle(h < member.health ? COLORS.healthRed : 0x3A3A3A);
                graphics.fillCircle(iconX - 6 + h * 6, barY + 10, 3);
            }
            iconX += 35;
        }
    }
}

// Title screen
function drawTitleScreen() {
    // Background
    graphics.fillStyle(0x1A1A2E);
    graphics.fillRect(0, 0, 960, 640);

    // Frame
    graphics.fillStyle(COLORS.parchment);
    graphics.fillRect(200, 150, 560, 340);
    graphics.lineStyle(8, COLORS.leather);
    graphics.strokeRect(200, 150, 560, 340);
    graphics.lineStyle(2, COLORS.goldAccent);
    graphics.strokeRect(215, 165, 530, 310);

    // Title
    const title1 = scene.add.text(480, 230, 'CURIOUS', { fontFamily: 'Georgia', fontSize: '48px', fontStyle: 'bold', color: '#3E2723' });
    title1.setOrigin(0.5, 0.5);
    const title2 = scene.add.text(480, 290, 'EXPEDITION', { fontFamily: 'Georgia', fontSize: '48px', fontStyle: 'bold', color: '#3E2723' });
    title2.setOrigin(0.5, 0.5);
    const subtitle = scene.add.text(480, 340, 'A Victorian Exploration Adventure', { fontFamily: 'Georgia', fontSize: '20px', fontStyle: 'italic', color: '#3E2723' });
    subtitle.setOrigin(0.5, 0.5);
    const instruction = scene.add.text(480, 420, 'Click anywhere to begin your expedition', { fontFamily: 'Georgia', fontSize: '18px', color: '#3E2723' });
    instruction.setOrigin(0.5, 0.5);

    scene.time.delayedCall(16, () => {
        title1.destroy();
        title2.destroy();
        subtitle.destroy();
        instruction.destroy();
    });
}

// Game over
function drawGameOver() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(520, 0, 440, 640);

    const gameOverText = scene.add.text(740, 300, 'EXPEDITION FAILED', { fontFamily: 'Georgia', fontSize: '36px', fontStyle: 'bold', color: '#C62828' });
    gameOverText.setOrigin(0.5, 0.5);
    const retryText = scene.add.text(740, 350, 'Click to try again', { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF' });
    retryText.setOrigin(0.5, 0.5);

    scene.time.delayedCall(16, () => {
        gameOverText.destroy();
        retryText.destroy();
    });
}

// Victory
function drawVictory() {
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRect(520, 0, 440, 640);

    const victoryText = scene.add.text(740, 280, 'PYRAMID FOUND!', { fontFamily: 'Georgia', fontSize: '36px', fontStyle: 'bold', color: '#DAA520' });
    victoryText.setOrigin(0.5, 0.5);
    const fameText = scene.add.text(740, 330, `Fame: ${gameState.fame}`, { fontFamily: 'Georgia', fontSize: '20px', color: '#FFFFFF' });
    fameText.setOrigin(0.5, 0.5);
    const nextText = scene.add.text(740, 380, 'Click for next expedition', { fontFamily: 'Georgia', fontSize: '18px', color: '#FFFFFF' });
    nextText.setOrigin(0.5, 0.5);

    scene.time.delayedCall(16, () => {
        victoryText.destroy();
        fameText.destroy();
        nextText.destroy();
    });
}

// Click handler
function handleClick(pointer) {
    const x = pointer.x;
    const y = pointer.y;

    if (gameState.state === 'title') {
        gameState.state = 'map';
        journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
        return;
    }

    if (gameState.state === 'event') {
        const startY = 350;
        const buttonWidth = 380;
        const buttonHeight = 45;
        const gap = 12;

        for (let i = 0; i < eventChoices.length; i++) {
            const by = startY + i * (buttonHeight + gap);
            if (x >= 95 && x <= 95 + buttonWidth && y >= by && y <= by + buttonHeight) {
                handleChoice(i);
                return;
            }
        }
        return;
    }

    if (gameState.state === 'map') {
        if (x > 520) {
            const neighbors = getNeighbors(party.x, party.y);
            const validMoves = neighbors.filter(n => {
                if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) return false;
                const terrain = TERRAIN_TYPES[hexMap[n.y][n.x]];
                return terrain.passable;
            });

            if (validMoves.length > 0) {
                validMoves.sort((a, b) => b.x - a.x);
                moveParty(validMoves[0].x, validMoves[0].y);
            }
        }
    }

    if (gameState.state === 'victory' || gameState.state === 'gameOver') {
        party.sanity = 100;
        party.members = [
            { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3 },
            { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2 },
            { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2 }
        ];
        gameState.day = 1;
        gameState.expedition++;
        pyramidFound = false;
        generateMap();
        revealFog(party.x, party.y);
        gameState.state = 'map';
        journalText = `Expedition ${gameState.expedition} begins! The search for glory continues.`;
        journalDay = gameState.day;
    }
}

function handleMouseMove(pointer) {
    selectedChoice = -1;

    if (gameState.state === 'event') {
        const startY = 350;
        const buttonWidth = 380;
        const buttonHeight = 45;
        const gap = 12;

        for (let i = 0; i < eventChoices.length; i++) {
            const by = startY + i * (buttonHeight + gap);
            if (pointer.x >= 95 && pointer.x <= 95 + buttonWidth && pointer.y >= by && pointer.y <= by + buttonHeight) {
                selectedChoice = i;
                break;
            }
        }
    }
}

function moveParty(toX, toY) {
    const terrain = TERRAIN_TYPES[hexMap[toY][toX]];
    const cost = terrain.cost + 3;

    party.sanity = Math.max(0, party.sanity - cost);
    party.x = toX;
    party.y = toY;
    gameState.day++;
    journalDay = gameState.day;

    revealFog(toX, toY);

    const location = locations.find(l => l.x === toX && l.y === toY);
    if (location) {
        triggerEvent(location.type);
        return;
    }

    if (Math.random() < 0.15) {
        triggerEvent('nightCamp');
        return;
    }

    journalText = `Day ${gameState.day}. We traveled through the ${terrain.name.toLowerCase()}. The journey cost us ${cost} sanity.`;

    if (party.sanity <= 0) {
        const explorer = party.members.find(m => m.type === 'explorer');
        if (explorer) {
            explorer.health--;
            party.sanity = 20;
            journalText = 'Madness! The expedition leader collapsed from exhaustion. We barely managed to revive them.';

            if (explorer.health <= 0) {
                gameState.state = 'gameOver';
                journalText = 'The expedition has ended in tragedy. The explorer perished in the wilderness.';
            }
        }
    }
}

function triggerEvent(eventType) {
    const eventData = EVENTS[eventType];
    if (eventData) {
        currentEvent = eventType;
        journalText = eventData.text;
        eventChoices = eventData.choices;
        gameState.state = 'event';
    }
}

function handleChoice(choiceIndex) {
    const choice = eventChoices[choiceIndex];

    switch (choice.result) {
        case 'trade':
            journalText = 'We traded with the villagers. (+1 Torch)';
            party.inventory.push('Torch');
            break;
        case 'rest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 20);
            journalText = 'We rested in the village. (+20 Sanity)';
            break;
        case 'investigate':
            if (Math.random() < 0.6) {
                party.sanity = Math.min(party.maxSanity, party.sanity + 10);
                journalText = 'The shrine contained ancient wisdom. (+10 Sanity)';
            } else {
                party.sanity = Math.max(0, party.sanity - 15);
                journalText = 'The shrine was cursed! (-15 Sanity)';
            }
            break;
        case 'offering':
            if (party.inventory.length > 0) {
                party.inventory.pop();
                party.sanity = Math.min(party.maxSanity, party.sanity + 30);
                journalText = 'We made an offering. (+30 Sanity)';
            } else {
                journalText = 'We had nothing to offer.';
            }
            break;
        case 'enterPyramid':
            pyramidFound = true;
            gameState.fame += 100;
            gameState.state = 'victory';
            journalText = `SUCCESS! Fame earned: 100. Click to continue.`;
            return;
        case 'exploreCave':
            if (Math.random() < 0.5) {
                party.inventory.push('Gold Idol');
                journalText = 'Found a golden idol! (+Gold Idol)';
            } else {
                const member = party.members.find(m => m.health > 0 && m.type !== 'explorer');
                if (member) {
                    member.health--;
                    journalText = `${member.name} was wounded!`;
                } else {
                    party.sanity = Math.max(0, party.sanity - 20);
                    journalText = 'A creature attacked! (-20 Sanity)';
                }
            }
            break;
        case 'oasisRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 30);
            journalText = 'The oasis restored us. (+30 Sanity)';
            break;
        case 'fillWater':
            party.inventory.push('Water');
            journalText = 'Filled canteens. (+Water)';
            break;
        case 'campRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 15);
            gameState.day++;
            journalDay = gameState.day;
            journalText = 'Rested through the night. (+15 Sanity)';
            break;
        case 'watch':
            journalText = 'We kept watch. The night passed uneventfully.';
            break;
        case 'leave':
        default:
            journalText = `Day ${gameState.day}. We moved on.`;
            break;
    }

    eventChoices = [];
    currentEvent = null;
    gameState.state = 'map';
}
