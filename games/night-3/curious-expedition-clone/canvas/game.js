// Curious Expedition Clone - Canvas Version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 960;
canvas.height = 640;

// Color Palette
const COLORS = {
    parchment: '#F5E6D3',
    parchmentDark: '#E8D5C0',
    leather: '#8B4513',
    leatherDark: '#5D2E0C',
    inkBrown: '#3E2723',
    buttonBg: '#4A3728',
    buttonBorder: '#2E1F14',
    goldAccent: '#D4A84B',
    dangerRed: '#C62828',
    highlightRed: '#B85450',

    // Terrain
    grassland: '#5A8F3E',
    jungle: '#2E7D32',
    jungleDark: '#1B5E20',
    desert: '#D4A559',
    water: '#2E6B8A',
    mountain: '#6B5B4F',
    village: '#C4A35A',
    shrine: '#9C7C5C',
    pyramid: '#DAA520',

    // Sky
    daySky: '#6BC5D2',
    nightSky: '#1A1A3E',

    // UI
    sanityBlue: '#4A90B8',
    healthRed: '#B85450',
    fogOfWar: '#2A2A4A'
};

// Game State
const game = {
    state: 'title', // title, map, event, combat, gameOver, victory
    day: 1,
    expedition: 1,
    fame: 0
};

// Party
const party = {
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

// Hex Map Configuration
const HEX_SIZE = 28;
const MAP_WIDTH = 12;
const MAP_HEIGHT = 10;
const MAP_OFFSET_X = 560;
const MAP_OFFSET_Y = 80;

// Terrain Types
const TERRAIN_TYPES = {
    grass: { cost: 2, color: COLORS.grassland, passable: true, name: 'Grassland' },
    jungle: { cost: 5, color: COLORS.jungle, passable: true, name: 'Light Jungle' },
    thickJungle: { cost: 10, color: COLORS.jungleDark, passable: true, name: 'Thick Jungle' },
    desert: { cost: 8, color: COLORS.desert, passable: true, name: 'Desert' },
    water: { cost: 0, color: COLORS.water, passable: false, name: 'Deep Water' },
    mountain: { cost: 0, color: COLORS.mountain, passable: false, name: 'Mountain' }
};

// Location Types
const LOCATION_TYPES = {
    village: { name: 'Village', color: '#C4A35A', icon: 'hut' },
    shrine: { name: 'Shrine', color: '#9C7C5C', icon: 'shrine' },
    pyramid: { name: 'Golden Pyramid', color: '#DAA520', icon: 'pyramid' },
    cave: { name: 'Cave', color: '#4A4A4A', icon: 'cave' },
    oasis: { name: 'Oasis', color: '#4ECDC4', icon: 'oasis' }
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
    lowSanity: {
        title: 'Madness Takes Hold',
        text: 'The expedition has pushed us to our limits. Exhaustion and fear cloud our minds. We must rest soon or face dire consequences.',
        choices: [
            { text: 'Push forward', result: 'pushOn' },
            { text: 'Make camp', result: 'camp' }
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

// Initialize game
function init() {
    generateMap();
    revealFog(party.x, party.y);
    journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
    journalDay = game.day;

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    requestAnimationFrame(gameLoop);
}

// Generate hex map
function generateMap() {
    hexMap = [];
    locations = [];
    fogOfWar = [];

    // Generate terrain
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
            fogOfWar[y][x] = true; // Initially all fog
        }
    }

    // Set starting position (grass)
    party.x = 1;
    party.y = Math.floor(MAP_HEIGHT / 2);
    hexMap[party.y][party.x] = 'grass';
    hexMap[party.y][party.x + 1] = 'grass';

    // Place locations
    // Golden Pyramid (far right side)
    const pyramidX = MAP_WIDTH - 2;
    const pyramidY = Math.floor(MAP_HEIGHT / 2) + Math.floor(Math.random() * 3) - 1;
    locations.push({ x: pyramidX, y: pyramidY, type: 'pyramid' });
    hexMap[pyramidY][pyramidX] = 'grass';

    // Villages
    for (let i = 0; i < 3; i++) {
        placeLocation('village');
    }

    // Shrines
    for (let i = 0; i < 2; i++) {
        placeLocation('shrine');
    }

    // Cave
    placeLocation('cave');

    // Oasis
    placeLocation('oasis');
}

function placeLocation(type) {
    let attempts = 0;
    while (attempts < 50) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

        // Check not too close to other locations
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

// Reveal fog of war around position
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

// Hex coordinate helpers
function hexToPixel(hx, hy) {
    const x = MAP_OFFSET_X + hx * HEX_SIZE * 1.5;
    const y = MAP_OFFSET_Y + hy * HEX_SIZE * 1.73 + (hx % 2) * HEX_SIZE * 0.866;
    return { x, y };
}

function pixelToHex(px, py) {
    const x = (px - MAP_OFFSET_X) / (HEX_SIZE * 1.5);
    const y = (py - MAP_OFFSET_Y - (Math.round(x) % 2) * HEX_SIZE * 0.866) / (HEX_SIZE * 1.73);
    return { x: Math.round(x), y: Math.round(y) };
}

// Draw hexagon
function drawHex(cx, cy, size, fillColor, strokeColor) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Draw the map / scene panel (right side)
function drawMap() {
    const isNight = game.day % 5 === 0;

    // During events, show detailed scene; otherwise show exploration scene
    if (game.state === 'event' && currentEvent) {
        drawEventScene(currentEvent, isNight);
    } else {
        drawExplorationScene(isNight);
    }
}

// Draw detailed pixel art scene for events
function drawEventScene(eventType, isNight) {
    const sceneX = 520;
    const sceneW = 440;

    // Sky gradient
    if (isNight) {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 400);
        gradient.addColorStop(0, '#0D0D1A');
        gradient.addColorStop(0.5, '#1A1A3E');
        gradient.addColorStop(1, '#2A2A4A');
        ctx.fillStyle = gradient;
    } else {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 400);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(0.4, '#7DD8D8');
        gradient.addColorStop(1, '#A8E6CE');
        ctx.fillStyle = gradient;
    }
    ctx.fillRect(sceneX, 0, sceneW, 640);

    // Draw scene based on event type
    switch(eventType) {
        case 'village':
            drawVillageScene(sceneX, isNight);
            break;
        case 'shrine':
            drawShrineScene(sceneX, isNight);
            break;
        case 'pyramid':
            drawPyramidScene(sceneX, isNight);
            break;
        case 'cave':
            drawCaveScene(sceneX, isNight);
            break;
        case 'oasis':
            drawOasisScene(sceneX, isNight);
            break;
        case 'nightCamp':
        case 'lowSanity':
            drawCampScene(sceneX);
            break;
        default:
            drawJungleScene(sceneX, isNight);
    }
}

// Draw exploration scene with mini-map
function drawExplorationScene(isNight) {
    const sceneX = 520;

    // Sky
    if (isNight) {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 640);
        gradient.addColorStop(0, '#0D0D1A');
        gradient.addColorStop(1, '#1A1A3E');
        ctx.fillStyle = gradient;
    } else {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 640);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(0.6, '#7DD8D8');
        gradient.addColorStop(1, '#5A8F3E');
        ctx.fillStyle = gradient;
    }
    ctx.fillRect(sceneX, 0, 440, 640);

    // Draw jungle/exploration background
    drawJungleScene(sceneX, isNight);

    // Mini-map overlay in corner
    drawMiniMap(sceneX + 20, 20);
}

function drawVillageScene(x, isNight) {
    // Background mountains
    ctx.fillStyle = isNight ? '#1A3A2A' : '#3E8B4E';
    drawMountainRange(x, 80, 440, 100);

    // Mid-ground trees
    const treeColor = isNight ? '#1A4A2A' : '#2E7D32';
    for (let i = 0; i < 10; i++) {
        drawTree(x + 30 + i * 45, 150 + Math.sin(i) * 20, 40 + Math.random() * 20, treeColor);
    }

    // Ground
    ctx.fillStyle = isNight ? '#2A4A2A' : '#5A8F3E';
    ctx.fillRect(x, 350, 440, 290);

    // Grass texture
    ctx.fillStyle = isNight ? '#3A5A3A' : '#6BA34E';
    for (let i = 0; i < 50; i++) {
        const gx = x + Math.random() * 440;
        const gy = 360 + Math.random() * 200;
        ctx.fillRect(gx, gy, 3, 8);
    }

    // Draw huts (pixel art style)
    drawHut(x + 120, 320, 80, 70);
    drawHut(x + 250, 300, 100, 90);
    drawHut(x + 350, 340, 70, 60);

    // Wooden fence
    ctx.fillStyle = '#5D4037';
    for (let i = 0; i < 12; i++) {
        ctx.fillRect(x + 300 + i * 12, 480, 6, 40);
        ctx.fillRect(x + 300 + i * 12, 470, 6, 15);
    }

    // Villagers (pixel people)
    drawPixelPerson(x + 180, 420, '#8B4513', '#B85450');
    drawPixelPerson(x + 280, 440, '#6B3A0A', '#4A90B8');
    drawPixelPerson(x + 350, 430, '#8B4513', '#C4A35A');

    // Party members
    drawExplorerSprite(x + 220, 450);
    drawDonkeySprite(x + 260, 460);

    // Speech bubble
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x + 280, 400, 100, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2A2A2A';
    ctx.font = 'italic 12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('We should study their culture.', x + 280, 405);
}

function drawPyramidScene(x, isNight) {
    // Sky with clouds
    const gradient = ctx.createLinearGradient(x, 0, x, 400);
    gradient.addColorStop(0, '#4ECDC4');
    gradient.addColorStop(0.5, '#7DD8D8');
    gradient.addColorStop(1, '#A8E6CE');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    // Clouds
    ctx.fillStyle = '#FFFFFF';
    drawCloud(x + 80, 60, 50);
    drawCloud(x + 280, 40, 40);
    drawCloud(x + 380, 80, 35);

    // Distant mountains
    ctx.fillStyle = '#5A8A6E';
    drawMountainRange(x, 150, 440, 80);

    // Jungle trees behind pyramid
    for (let i = 0; i < 15; i++) {
        drawTree(x + 20 + i * 30, 200 + Math.sin(i * 0.8) * 30, 50, '#2E7D32');
    }

    // THE GOLDEN PYRAMID
    drawGoldenPyramid(x + 220, 120, 200, 250);

    // Foreground ground
    ctx.fillStyle = '#5A8F3E';
    ctx.fillRect(x, 500, 440, 140);

    // Path to pyramid
    ctx.fillStyle = '#7A8A5A';
    ctx.beginPath();
    ctx.moveTo(x + 180, 640);
    ctx.lineTo(x + 260, 640);
    ctx.lineTo(x + 235, 500);
    ctx.lineTo(x + 205, 500);
    ctx.fill();

    // Trees in foreground
    drawTree(x + 50, 480, 60, '#1B5E20');
    drawTree(x + 380, 470, 70, '#1B5E20');

    // Party approaching
    drawExplorerSprite(x + 200, 560);
    drawDonkeySprite(x + 160, 570);
    drawPixelPerson(x + 240, 550, '#4A6FA5', '#8B4513');
}

function drawCampScene(x) {
    // Night sky
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#0D0D1A');
    gradient.addColorStop(0.4, '#1A1A3E');
    gradient.addColorStop(1, '#2A3A4A');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
        const sx = x + Math.random() * 440;
        const sy = Math.random() * 300;
        const size = Math.random() < 0.1 ? 3 : 1;
        ctx.fillRect(sx, sy, size, size);
    }

    // Moon
    ctx.fillStyle = '#E8E8D0';
    ctx.beginPath();
    ctx.arc(x + 350, 80, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0D0D1A';
    ctx.beginPath();
    ctx.arc(x + 340, 75, 22, 0, Math.PI * 2);
    ctx.fill();

    // Silhouette trees
    ctx.fillStyle = '#0A1520';
    for (let i = 0; i < 8; i++) {
        drawTreeSilhouette(x + 30 + i * 55, 280, 80 + Math.random() * 40);
    }

    // Ground
    ctx.fillStyle = '#1A2A2A';
    ctx.fillRect(x, 400, 440, 240);

    // Campfire glow
    const glowGradient = ctx.createRadialGradient(x + 220, 480, 10, x + 220, 480, 120);
    glowGradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x + 100, 360, 240, 240);

    // Campfire
    drawCampfire(x + 220, 480);

    // Party sitting around fire
    drawExplorerSprite(x + 150, 470);
    drawPixelPerson(x + 280, 465, '#8B4513', '#4A6FA5');
    drawDonkeySprite(x + 320, 450);

    // Ghosts (if low sanity event)
    if (currentEvent === 'lowSanity') {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#6A8AB8';
        drawGhost(x + 350, 420);
        drawGhost(x + 380, 400);
        ctx.globalAlpha = 1;
    }
}

function drawShrineScene(x, isNight) {
    // Background
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    if (isNight) {
        gradient.addColorStop(0, '#1A1A3E');
        gradient.addColorStop(1, '#2A3A4A');
    } else {
        gradient.addColorStop(0, '#6BCFC4');
        gradient.addColorStop(1, '#4A8A5E');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    // Forest background
    const shrineTreeColor = isNight ? '#1A3A2A' : '#2E6D32';
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 150, 70, shrineTreeColor);
    }

    // Ground
    ctx.fillStyle = isNight ? '#2A3A2A' : '#4A7A4E';
    ctx.fillRect(x, 380, 440, 260);

    // Stone shrine
    drawStoneShrine(x + 220, 300);

    // Mystical glow
    const glowGradient = ctx.createRadialGradient(x + 220, 350, 20, x + 220, 350, 100);
    glowGradient.addColorStop(0, 'rgba(218, 165, 32, 0.3)');
    glowGradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x + 220, 350, 100, 0, Math.PI * 2);
    ctx.fill();

    // Party
    drawExplorerSprite(x + 150, 480);
    drawDonkeySprite(x + 100, 490);
}

function drawCaveScene(x, isNight) {
    // Dark cave background
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x, 0, 440, 640);

    // Cave entrance frame
    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 120, 0);
    ctx.lineTo(x + 80, 200);
    ctx.lineTo(x + 60, 640);
    ctx.lineTo(x, 640);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 440, 0);
    ctx.lineTo(x + 320, 0);
    ctx.lineTo(x + 360, 200);
    ctx.lineTo(x + 380, 640);
    ctx.lineTo(x + 440, 640);
    ctx.fill();

    // Stalactites
    ctx.fillStyle = '#4A4A4A';
    for (let i = 0; i < 8; i++) {
        const sx = x + 100 + i * 35;
        const sh = 30 + Math.random() * 50;
        ctx.beginPath();
        ctx.moveTo(sx - 10, 0);
        ctx.lineTo(sx, sh);
        ctx.lineTo(sx + 10, 0);
        ctx.fill();
    }

    // Torch light
    const torchGradient = ctx.createRadialGradient(x + 150, 400, 20, x + 150, 400, 150);
    torchGradient.addColorStop(0, 'rgba(255, 150, 50, 0.5)');
    torchGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = torchGradient;
    ctx.fillRect(x, 250, 300, 300);

    // Party with torch
    drawExplorerSprite(x + 180, 450);

    // Torch flame
    ctx.fillStyle = '#FF9932';
    ctx.beginPath();
    ctx.ellipse(x + 195, 430, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawOasisScene(x, isNight) {
    // Desert sky
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#F4D03F');
    gradient.addColorStop(1, '#D4A559');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    // Sand dunes
    ctx.fillStyle = '#D4A559';
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.quadraticCurveTo(x + 100, 250, x + 200, 300);
    ctx.quadraticCurveTo(x + 300, 350, x + 440, 280);
    ctx.lineTo(x + 440, 640);
    ctx.lineTo(x, 640);
    ctx.fill();

    // Oasis water
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.ellipse(x + 220, 450, 100, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water reflection
    ctx.fillStyle = '#3DBDB4';
    ctx.beginPath();
    ctx.ellipse(x + 220, 460, 80, 30, 0, 0, Math.PI);
    ctx.fill();

    // Palm trees
    drawPalmTree(x + 150, 380, 80);
    drawPalmTree(x + 280, 370, 90);
    drawPalmTree(x + 320, 400, 60);

    // Party resting
    drawExplorerSprite(x + 200, 500);
    drawDonkeySprite(x + 250, 510);
}

function drawJungleScene(x, isNight) {
    // Sky
    if (!isNight) {
        const gradient = ctx.createLinearGradient(x, 0, x, 300);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(1, '#7DD8D8');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 440, 640);
    }

    // Background trees
    const bgTreeColor = isNight ? '#1A3A2A' : '#3E8B4E';
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 120 + Math.sin(i) * 30, 60, bgTreeColor);
    }

    // Mid trees
    const midTreeColor = isNight ? '#1A4A2A' : '#2E7D32';
    for (let i = 0; i < 10; i++) {
        drawTree(x + 10 + i * 45, 200 + Math.cos(i) * 20, 70, midTreeColor);
    }

    // Ground
    ctx.fillStyle = isNight ? '#1A3A2A' : '#4A8A4E';
    ctx.fillRect(x, 400, 440, 240);

    // Foreground foliage
    const fgTreeColor = isNight ? '#0A2A1A' : '#1B5E20';
    for (let i = 0; i < 6; i++) {
        drawTree(x + i * 80, 500, 100, fgTreeColor);
    }

    // Party walking
    drawExplorerSprite(x + 220, 480);
    drawDonkeySprite(x + 180, 490);
}

// Helper drawing functions
function drawTree(x, y, height, foliageColor) {
    // Use passed color or default to current fill
    const leafColor = foliageColor || '#2E7D32';

    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 5, y, 10, height * 0.3);

    // Foliage (layered circles for pixel look)
    ctx.fillStyle = leafColor;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y - height * 0.2 - i * height * 0.2, height * 0.3 - i * 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTreeSilhouette(x, y, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - height * 0.4, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x + height * 0.4, y);
    ctx.fill();
}

function drawMountainRange(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    for (let i = 0; i <= width; i += 40) {
        const peakHeight = height * (0.5 + Math.sin(i * 0.05) * 0.5);
        ctx.lineTo(x + i, y + height - peakHeight);
    }
    ctx.lineTo(x + width, y + height);
    ctx.fill();
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawHut(x, y, width, height) {
    // Thatched roof
    ctx.fillStyle = '#C4A35A';
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y - height * 0.4);
    ctx.lineTo(x - width * 0.1, y + height * 0.3);
    ctx.lineTo(x + width * 1.1, y + height * 0.3);
    ctx.fill();

    // Roof texture
    ctx.strokeStyle = '#A08040';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2 + i * width * 0.15, y + height * 0.2);
        ctx.lineTo(x + width / 2, y - height * 0.3);
        ctx.stroke();
    }

    // Walls
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y + height * 0.3, width, height * 0.5);

    // Door
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + width * 0.4, y + height * 0.45, width * 0.2, height * 0.35);
}

function drawGoldenPyramid(x, y, width, height) {
    // Main pyramid body
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - width / 2, y + height);
    ctx.lineTo(x + width / 2, y + height);
    ctx.closePath();
    ctx.fill();

    // Shading (right side darker)
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

    // Steps/levels
    ctx.strokeStyle = '#A07000';
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
        const levelY = y + (height / 8) * i;
        const levelW = (width / 2) * (1 - i / 8);
        ctx.beginPath();
        ctx.moveTo(x - levelW, levelY);
        ctx.lineTo(x + levelW, levelY);
        ctx.stroke();
    }

    // Entrance
    ctx.fillStyle = '#2A1A0A';
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.6);
    ctx.lineTo(x - width * 0.08, y + height);
    ctx.lineTo(x + width * 0.08, y + height);
    ctx.closePath();
    ctx.fill();

    // Golden glow
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawStoneShrine(x, y) {
    // Base platform
    ctx.fillStyle = '#6A6A5A';
    ctx.fillRect(x - 60, y + 60, 120, 30);

    // Pillars
    ctx.fillStyle = '#7A7A6A';
    ctx.fillRect(x - 50, y - 20, 20, 80);
    ctx.fillRect(x + 30, y - 20, 20, 80);

    // Top stone
    ctx.fillRect(x - 55, y - 35, 110, 20);

    // Center altar
    ctx.fillStyle = '#5A5A4A';
    ctx.fillRect(x - 20, y + 20, 40, 40);

    // Glowing artifact
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(x, y + 30, 12, 0, Math.PI * 2);
    ctx.fill();

    // Symbols
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 40, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 40, y, 8, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPalmTree(x, y, height) {
    // Trunk
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x - 6, y, 12, height);

    // Fronds
    ctx.fillStyle = '#2E7D32';
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -30, 8, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawCampfire(x, y) {
    // Logs
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 25, y + 5, 50, 10);
    ctx.fillRect(x - 20, y + 10, 40, 8);

    // Fire
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 5);
    ctx.quadraticCurveTo(x - 20, y - 30, x, y - 45);
    ctx.quadraticCurveTo(x + 20, y - 30, x + 15, y + 5);
    ctx.fill();

    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 5);
    ctx.quadraticCurveTo(x - 10, y - 20, x, y - 30);
    ctx.quadraticCurveTo(x + 10, y - 20, x + 8, y + 5);
    ctx.fill();

    // Sparks
    ctx.fillStyle = '#FF9500';
    for (let i = 0; i < 5; i++) {
        const sparkX = x - 10 + Math.random() * 20;
        const sparkY = y - 50 - Math.random() * 30;
        ctx.fillRect(sparkX, sparkY, 3, 3);
    }
}

function drawGhost(x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.quadraticCurveTo(x + 20, y - 30, x + 20, y);
    ctx.lineTo(x + 20, y + 20);
    ctx.lineTo(x + 15, y + 15);
    ctx.lineTo(x + 10, y + 20);
    ctx.lineTo(x + 5, y + 15);
    ctx.lineTo(x, y + 20);
    ctx.lineTo(x - 5, y + 15);
    ctx.lineTo(x - 10, y + 20);
    ctx.lineTo(x - 15, y + 15);
    ctx.lineTo(x - 20, y + 20);
    ctx.lineTo(x - 20, y);
    ctx.quadraticCurveTo(x - 20, y - 30, x, y - 30);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1A1A3E';
    ctx.beginPath();
    ctx.arc(x - 6, y - 10, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawPixelPerson(x, y, skinColor, clothColor) {
    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(x - 4, y - 20, 8, 8);

    // Body
    ctx.fillStyle = clothColor;
    ctx.fillRect(x - 5, y - 12, 10, 12);

    // Legs
    ctx.fillStyle = skinColor;
    ctx.fillRect(x - 4, y, 3, 8);
    ctx.fillRect(x + 1, y, 3, 8);
}

function drawExplorerSprite(x, y) {
    // Hat
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 10, y - 28, 20, 4);
    ctx.fillRect(x - 6, y - 35, 12, 8);

    // Head
    ctx.fillStyle = '#E8B89D';
    ctx.fillRect(x - 5, y - 24, 10, 10);

    // Body (blue jacket)
    ctx.fillStyle = '#4A6FA5';
    ctx.fillRect(x - 6, y - 14, 12, 14);

    // Legs (khaki)
    ctx.fillStyle = '#C4A35A';
    ctx.fillRect(x - 5, y, 4, 10);
    ctx.fillRect(x + 1, y, 4, 10);

    // Boots
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x - 5, y + 8, 4, 4);
    ctx.fillRect(x + 1, y + 8, 4, 4);
}

function drawDonkeySprite(x, y) {
    // Body
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x - 12, y - 8, 24, 14);

    // Head
    ctx.fillRect(x - 18, y - 12, 10, 10);

    // Ears
    ctx.fillRect(x - 18, y - 18, 3, 8);
    ctx.fillRect(x - 12, y - 18, 3, 8);

    // Legs
    ctx.fillRect(x - 10, y + 6, 4, 10);
    ctx.fillRect(x + 6, y + 6, 4, 10);

    // Cargo
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 8, y - 14, 16, 8);
}

function drawMiniMap(x, y) {
    const miniSize = 6;
    const padding = 8;
    const mapW = MAP_WIDTH * miniSize + padding * 2;
    const mapH = MAP_HEIGHT * miniSize + padding * 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, mapW, mapH);

    // Border
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, mapW, mapH);

    // Draw hexes as squares for mini-map
    for (let my = 0; my < MAP_HEIGHT; my++) {
        for (let mx = 0; mx < MAP_WIDTH; mx++) {
            const px = x + padding + mx * miniSize;
            const py = y + padding + my * miniSize;

            if (fogOfWar[my][mx]) {
                ctx.fillStyle = '#2A2A4A';
            } else {
                const terrain = TERRAIN_TYPES[hexMap[my][mx]];
                ctx.fillStyle = terrain.color;
            }
            ctx.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
    }

    // Draw locations on mini-map
    for (const loc of locations) {
        if (!fogOfWar[loc.y][loc.x]) {
            const px = x + padding + loc.x * miniSize;
            const py = y + padding + loc.y * miniSize;
            ctx.fillStyle = loc.type === 'pyramid' ? '#FFD700' : '#FFFFFF';
            ctx.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
    }

    // Party position
    const ppx = x + padding + party.x * miniSize;
    const ppy = y + padding + party.y * miniSize;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(ppx, ppy, miniSize - 1, miniSize - 1);
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

// Draw the journal (left panel)
function drawJournal() {
    // Leather binding
    ctx.fillStyle = COLORS.leatherDark;
    ctx.fillRect(40, 40, 25, 560);
    ctx.fillStyle = COLORS.leather;
    ctx.fillRect(50, 45, 15, 550);

    // Parchment background
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(65, 50, 435, 540);

    // Parchment texture
    ctx.fillStyle = COLORS.parchmentDark;
    for (let i = 0; i < 20; i++) {
        const x = 70 + Math.random() * 420;
        const y = 55 + Math.random() * 530;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(x, y, Math.random() * 30 + 10, Math.random() * 3 + 1);
    }
    ctx.globalAlpha = 1;

    // Decorative border
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 60, 415, 520);

    // Metal clasps
    ctx.fillStyle = '#8A8A7A';
    ctx.fillRect(495, 150, 12, 25);
    ctx.fillRect(495, 400, 12, 25);
    ctx.fillStyle = '#6A6A5A';
    ctx.fillRect(497, 155, 8, 15);
    ctx.fillRect(497, 405, 8, 15);

    // Day header
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'italic 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Day ${journalDay}`, 282, 100);

    // Divider line
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 115);
    ctx.lineTo(420, 115);
    ctx.stroke();

    // Journal text
    ctx.font = '16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.inkBrown;
    wrapText(journalText, 95, 150, 380, 24);

    // Draw event choices if in event state
    if (game.state === 'event' && eventChoices.length > 0) {
        drawEventChoices();
    }

    // Draw status bar at bottom
    drawStatusBar();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    // Handle highlighted words (in red)
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            // Check for highlighted words
            drawHighlightedLine(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    drawHighlightedLine(line, x, currentY);
}

function drawHighlightedLine(line, x, y) {
    // Simple highlight: words in brackets are highlighted
    const parts = line.split(/(\[[^\]]+\])/g);
    let currentX = x;

    for (const part of parts) {
        if (part.startsWith('[') && part.endsWith(']')) {
            ctx.fillStyle = COLORS.highlightRed;
            const text = part.slice(1, -1);
            ctx.fillText(text, currentX, y);
            currentX += ctx.measureText(text).width;
        } else {
            ctx.fillStyle = COLORS.inkBrown;
            ctx.fillText(part, currentX, y);
            currentX += ctx.measureText(part).width;
        }
    }
}

function drawEventChoices() {
    const startY = 350;
    const buttonWidth = 380;
    const buttonHeight = 45;
    const gap = 12;

    for (let i = 0; i < eventChoices.length; i++) {
        const y = startY + i * (buttonHeight + gap);
        const isHovered = selectedChoice === i;

        // Button background
        ctx.fillStyle = isHovered ? '#5A4738' : COLORS.buttonBg;
        ctx.fillRect(95, y, buttonWidth, buttonHeight);

        // Decorative corners
        ctx.strokeStyle = COLORS.goldAccent;
        ctx.lineWidth = 2;

        // Top-left corner
        drawCorner(95, y, 12, false, false);
        // Top-right corner
        drawCorner(95 + buttonWidth, y, 12, true, false);
        // Bottom-left corner
        drawCorner(95, y + buttonHeight, 12, false, true);
        // Bottom-right corner
        drawCorner(95 + buttonWidth, y + buttonHeight, 12, true, true);

        // Button text
        ctx.fillStyle = COLORS.parchment;
        ctx.font = '18px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${eventChoices[i].text}`, 115, y + 28);
    }
}

function drawCorner(x, y, size, flipX, flipY) {
    const dx = flipX ? -1 : 1;
    const dy = flipY ? -1 : 1;

    ctx.beginPath();
    ctx.moveTo(x, y + dy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * size, y);
    ctx.stroke();

    // Inner corner
    ctx.beginPath();
    ctx.moveTo(x + dx * 4, y + dy * (size - 4));
    ctx.lineTo(x + dx * 4, y + dy * 4);
    ctx.lineTo(x + dx * (size - 4), y + dy * 4);
    ctx.stroke();
}

function drawStatusBar() {
    const barY = 545;

    // Sanity bar
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Sanity:', 95, barY);

    // Bar background
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(150, barY - 12, 150, 16);

    // Bar fill
    const sanityPercent = party.sanity / party.maxSanity;
    ctx.fillStyle = sanityPercent > 0.5 ? COLORS.sanityBlue :
                    sanityPercent > 0.25 ? '#D4A559' : COLORS.dangerRed;
    ctx.fillRect(150, barY - 12, 150 * sanityPercent, 16);

    // Sanity text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${party.sanity}/${party.maxSanity}`, 225, barY);

    // Party members
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Party:', 320, barY);

    let iconX = 365;
    for (const member of party.members) {
        if (member.health > 0) {
            // Member icon
            if (member.type === 'explorer') {
                ctx.fillStyle = '#4A6FA5';
            } else if (member.type === 'scout') {
                ctx.fillStyle = '#8B4513';
            } else {
                ctx.fillStyle = '#8B7355';
            }
            ctx.beginPath();
            ctx.arc(iconX, barY - 5, 8, 0, Math.PI * 2);
            ctx.fill();

            // Health dots
            for (let h = 0; h < member.maxHealth; h++) {
                ctx.fillStyle = h < member.health ? COLORS.healthRed : '#3A3A3A';
                ctx.beginPath();
                ctx.arc(iconX - 6 + h * 6, barY + 10, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            iconX += 35;
        }
    }
}

// Handle click events
function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'title') {
        game.state = 'map';
        journalText = 'The expedition begins! We have set out into the unknown wilderness in search of the legendary Golden Pyramid.';
        return;
    }

    if (game.state === 'event') {
        // Check choice buttons
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

    if (game.state === 'map') {
        // Clicking on the scene area moves the party
        if (x > 520) {
            // Find valid adjacent hexes
            const neighbors = getNeighbors(party.x, party.y);
            const validMoves = neighbors.filter(n => {
                if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) return false;
                const terrain = TERRAIN_TYPES[hexMap[n.y][n.x]];
                return terrain.passable;
            });

            if (validMoves.length > 0) {
                // Prioritize moving right/toward pyramid
                validMoves.sort((a, b) => b.x - a.x);
                const targetHex = validMoves[0];
                moveParty(targetHex.x, targetHex.y);
            }
        }
    }

    if (game.state === 'victory' || game.state === 'gameOver') {
        // Restart
        party.sanity = 100;
        party.members = [
            { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3 },
            { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2 },
            { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2 }
        ];
        game.day = 1;
        game.expedition++;
        pyramidFound = false;
        generateMap();
        revealFog(party.x, party.y);
        game.state = 'map';
        journalText = `Expedition ${game.expedition} begins! The search for glory continues.`;
        journalDay = game.day;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedChoice = -1;

    if (game.state === 'event') {
        const startY = 350;
        const buttonWidth = 380;
        const buttonHeight = 45;
        const gap = 12;

        for (let i = 0; i < eventChoices.length; i++) {
            const by = startY + i * (buttonHeight + gap);
            if (x >= 95 && x <= 95 + buttonWidth && y >= by && y <= by + buttonHeight) {
                selectedChoice = i;
                break;
            }
        }
    }
}

function moveParty(toX, toY) {
    const terrain = TERRAIN_TYPES[hexMap[toY][toX]];
    const cost = terrain.cost + 3; // Base travel cost

    party.sanity = Math.max(0, party.sanity - cost);
    party.x = toX;
    party.y = toY;
    game.day++;
    journalDay = game.day;

    revealFog(toX, toY);

    // Check for location
    const location = locations.find(l => l.x === toX && l.y === toY);
    if (location) {
        triggerEvent(location.type);
        return;
    }

    // Random events
    if (party.sanity <= 20 && Math.random() < 0.3) {
        triggerEvent('lowSanity');
        return;
    }

    if (Math.random() < 0.15) {
        triggerEvent('nightCamp');
        return;
    }

    // Update journal for travel
    journalText = `Day ${game.day}. We traveled through the ${terrain.name.toLowerCase()}. The journey cost us ${cost} sanity.`;

    // Check game over
    if (party.sanity <= 0) {
        const explorer = party.members.find(m => m.type === 'explorer');
        if (explorer) {
            explorer.health--;
            party.sanity = 20;
            journalText = 'Madness! The expedition leader collapsed from exhaustion. We barely managed to revive them.';

            if (explorer.health <= 0) {
                game.state = 'gameOver';
                journalText = 'The expedition has ended in tragedy. The explorer perished in the wilderness, never to find the Golden Pyramid.';
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
        game.state = 'event';
    }
}

function handleChoice(choiceIndex) {
    const choice = eventChoices[choiceIndex];

    switch (choice.result) {
        case 'trade':
            journalText = 'We traded with the villagers. They gave us supplies in exchange for our whiskey. (+1 Torch)';
            party.inventory.push('Torch');
            break;

        case 'rest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 20);
            journalText = 'We rested in the village. The hospitality of the natives restored our spirits. (+20 Sanity)';
            break;

        case 'investigate':
            if (Math.random() < 0.6) {
                party.sanity = Math.min(party.maxSanity, party.sanity + 10);
                journalText = 'The shrine contained ancient wisdom. We feel enlightened. (+10 Sanity)';
            } else {
                party.sanity = Math.max(0, party.sanity - 15);
                journalText = 'The shrine was cursed! Dark visions plagued our minds. (-15 Sanity)';
            }
            break;

        case 'offering':
            if (party.inventory.length > 0) {
                const item = party.inventory.pop();
                party.sanity = Math.min(party.maxSanity, party.sanity + 30);
                journalText = `We offered our ${item} to the shrine. A warm light embraced us. (+30 Sanity)`;
            } else {
                journalText = 'We had nothing to offer the shrine.';
            }
            break;

        case 'enterPyramid':
            pyramidFound = true;
            game.fame += 100;
            game.state = 'victory';
            journalText = `SUCCESS! We entered the Golden Pyramid and claimed its treasures! Expedition ${game.expedition} complete. Fame earned: 100. Click to start next expedition.`;
            return;

        case 'exploreCave':
            if (Math.random() < 0.5) {
                party.inventory.push('Gold Idol');
                journalText = 'We found a golden idol hidden in the depths of the cave! (+Gold Idol)';
            } else {
                const member = party.members.find(m => m.health > 0 && m.type !== 'explorer');
                if (member) {
                    member.health--;
                    journalText = `A creature attacked us in the darkness! ${member.name} was wounded.`;
                } else {
                    party.sanity = Math.max(0, party.sanity - 20);
                    journalText = 'A creature attacked us but we fought it off. (-20 Sanity)';
                }
            }
            break;

        case 'oasisRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 30);
            journalText = 'The oasis provided much needed rest. We feel completely refreshed. (+30 Sanity)';
            break;

        case 'fillWater':
            party.inventory.push('Water');
            journalText = 'We filled our canteens with fresh water. (+Water)';
            break;

        case 'pushOn':
            party.sanity = Math.max(0, party.sanity - 10);
            journalText = 'We pushed on despite our exhaustion. The toll on our minds was severe. (-10 Sanity)';
            break;

        case 'camp':
        case 'campRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 15);
            game.day++;
            journalDay = game.day;
            journalText = 'We made camp and rested through the night. Morning brought renewed hope. (+15 Sanity)';
            break;

        case 'watch':
            journalText = 'We kept watch through the night. The darkness held many sounds but no threats materialized.';
            break;

        case 'leave':
        default:
            journalText = `Day ${game.day}. We decided to move on from this place.`;
            break;
    }

    eventChoices = [];
    currentEvent = null;
    game.state = 'map';
}

// Draw title screen
function drawTitleScreen() {
    // Background
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative frame
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(200, 150, 560, 340);

    ctx.strokeStyle = COLORS.leather;
    ctx.lineWidth = 8;
    ctx.strokeRect(200, 150, 560, 340);

    ctx.strokeStyle = COLORS.goldAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(215, 165, 530, 310);

    // Title
    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CURIOUS', 480, 240);
    ctx.fillText('EXPEDITION', 480, 295);

    // Subtitle
    ctx.font = 'italic 20px Georgia';
    ctx.fillText('A Victorian Exploration Adventure', 480, 340);

    // Instructions
    ctx.font = '18px Georgia';
    ctx.fillText('Click anywhere to begin your expedition', 480, 420);

    // Decorative elements
    ctx.fillStyle = COLORS.goldAccent;
    ctx.beginPath();
    ctx.moveTo(350, 370);
    ctx.lineTo(360, 375);
    ctx.lineTo(350, 380);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(610, 370);
    ctx.lineTo(600, 375);
    ctx.lineTo(610, 380);
    ctx.fill();
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(520, 0, 440, 640);

    ctx.fillStyle = COLORS.dangerRed;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('EXPEDITION FAILED', 740, 300);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Georgia';
    ctx.fillText('Click to try again', 740, 350);
}

// Draw victory screen
function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(520, 0, 440, 640);

    ctx.fillStyle = COLORS.goldAccent;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PYRAMID FOUND!', 740, 280);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Georgia';
    ctx.fillText(`Fame: ${game.fame}`, 740, 330);
    ctx.font = '18px Georgia';
    ctx.fillText('Click for next expedition', 740, 380);
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'title') {
        drawTitleScreen();
    } else {
        drawMap();
        drawJournal();

        if (game.state === 'gameOver') {
            drawGameOver();
        } else if (game.state === 'victory') {
            drawVictory();
        }
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
init();
