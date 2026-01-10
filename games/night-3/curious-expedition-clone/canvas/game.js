// Curious Expedition Clone - Canvas Version (Expanded)
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
    grassland: '#5A8F3E',
    jungle: '#2E7D32',
    jungleDark: '#1B5E20',
    desert: '#D4A559',
    water: '#2E6B8A',
    mountain: '#6B5B4F',
    village: '#C4A35A',
    shrine: '#9C7C5C',
    pyramid: '#DAA520',
    daySky: '#6BC5D2',
    nightSky: '#1A1A3E',
    sanityBlue: '#4A90B8',
    healthRed: '#B85450',
    fogOfWar: '#2A2A4A'
};

// Game State
const game = {
    state: 'title',
    day: 1,
    expedition: 1,
    fame: 0,
    screenShake: 0,
    screenFlash: null,
    flashAlpha: 0,
    particles: [],
    floatingTexts: [],
    achievements: [],
    weather: 'clear',
    weatherTimer: 30,
    treeAnim: 0,
    transitionAlpha: 0
};

// Weather types
const WEATHER_TYPES = ['clear', 'cloudy', 'rainy', 'foggy'];

// Party
const party = {
    sanity: 100,
    maxSanity: 100,
    members: [
        { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3, ability: 'Navigate' },
        { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2, ability: 'Track' },
        { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2, cargo: 3 }
    ],
    inventory: ['Torch', 'Rope', 'Whiskey'],
    maxInventory: 10,
    x: 0,
    y: 0,
    blessings: [],
    curses: [],
    combatBonus: 0,
    treasureFound: 0
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
    mountain: { cost: 0, color: COLORS.mountain, passable: false, name: 'Mountain' },
    swamp: { cost: 12, color: '#4A5A3A', passable: true, name: 'Swamp' }
};

// Location Types (expanded)
const LOCATION_TYPES = {
    village: { name: 'Village', color: '#C4A35A', icon: 'hut' },
    shrine: { name: 'Shrine', color: '#9C7C5C', icon: 'shrine' },
    pyramid: { name: 'Golden Pyramid', color: '#DAA520', icon: 'pyramid' },
    cave: { name: 'Cave', color: '#4A4A4A', icon: 'cave' },
    oasis: { name: 'Oasis', color: '#4ECDC4', icon: 'oasis' },
    ruins: { name: 'Ancient Ruins', color: '#7A7A6A', icon: 'ruins' },
    tradingPost: { name: 'Trading Post', color: '#8B6914', icon: 'post' },
    waterfall: { name: 'Waterfall', color: '#6ECFEA', icon: 'water' }
};

// Map Data
let hexMap = [];
let locations = [];
let fogOfWar = [];
let pyramidFound = false;
let visitedLocations = [];
let revealedSecrets = [];

// Event System
let currentEvent = null;
let eventChoices = [];
let selectedChoice = -1;
let combatEnemy = null;
let combatPhase = null;

// Journal text
let journalText = '';
let journalDay = 1;

// Events Database (expanded)
const EVENTS = {
    village: {
        title: 'Native Village',
        text: 'We entered a native village of a warrior tribe. The villagers had been awaiting us. They seemed to know about us already. They were cautious, but politely offered their help.',
        choices: [
            { text: 'Trade supplies', result: 'trade' },
            { text: 'Rest (+20 Sanity)', result: 'rest' },
            { text: 'Hire guide (+Scout)', result: 'hireGuide' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    shrine: {
        title: 'Ancient Shrine',
        text: 'We discovered an ancient shrine covered in strange symbols. The air feels heavy with mystical energy. Our native scout warns us to be careful.',
        choices: [
            { text: 'Investigate', result: 'investigate' },
            { text: 'Make an offering', result: 'offering' },
            { text: 'Pray for blessing', result: 'pray' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    pyramid: {
        title: 'The Golden Pyramid',
        text: 'There was the golden pyramid, enthroned above the landscape. I found the goal of my journey!',
        choices: [
            { text: 'Enter the pyramid', result: 'enterPyramid' },
            { text: 'Search for secret entrance', result: 'searchSecret' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    cave: {
        title: 'Dark Cave',
        text: 'A dark cave entrance looms before us. Strange sounds echo from within. There could be treasures... or dangers.',
        choices: [
            { text: 'Explore with torch', result: 'exploreCave' },
            { text: 'Search entrance only', result: 'searchEntrance' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    oasis: {
        title: 'Desert Oasis',
        text: 'We stumbled upon a beautiful oasis. Crystal clear water and shade from palm trees. A perfect place to rest.',
        choices: [
            { text: 'Rest (+30 Sanity)', result: 'oasisRest' },
            { text: 'Fill canteens', result: 'fillWater' },
            { text: 'Search for herbs', result: 'searchHerbs' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    ruins: {
        title: 'Ancient Ruins',
        text: 'Crumbling stone structures emerge from the jungle. These ruins predate any known civilization. Who built them?',
        choices: [
            { text: 'Excavate (+Treasure?)', result: 'excavate' },
            { text: 'Study inscriptions', result: 'study' },
            { text: 'Set up camp', result: 'campRuins' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    tradingPost: {
        title: 'Trading Post',
        text: 'A bustling trading post run by European merchants. They offer various supplies and information.',
        choices: [
            { text: 'Buy supplies', result: 'buySupplies' },
            { text: 'Sell treasures', result: 'sellTreasures' },
            { text: 'Gather intel', result: 'gatherIntel' },
            { text: 'Leave', result: 'leave' }
        ]
    },
    waterfall: {
        title: 'Hidden Waterfall',
        text: 'A magnificent waterfall cascades into a crystal pool. The mist creates rainbows in the sunlight. It feels like a sacred place.',
        choices: [
            { text: 'Bathe (+25 Sanity, heal)', result: 'bathe' },
            { text: 'Search behind waterfall', result: 'searchWaterfall' },
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
            { text: 'Keep watch', result: 'watch' },
            { text: 'Tell stories (+Morale)', result: 'stories' }
        ]
    },
    animalAttack: {
        title: 'Predator Attack!',
        text: 'A fearsome predator emerges from the undergrowth! Its eyes gleam with hunger. We must defend ourselves!',
        choices: [
            { text: 'Fight!', result: 'fightAnimal' },
            { text: 'Flee (lose supplies)', result: 'fleeAnimal' }
        ]
    },
    nativeEncounter: {
        title: 'Tribal Warriors',
        text: 'A group of tribal warriors blocks our path. They seem hostile but are willing to talk.',
        choices: [
            { text: 'Negotiate', result: 'negotiate' },
            { text: 'Offer gifts', result: 'offerGifts' },
            { text: 'Fight', result: 'fightNatives' },
            { text: 'Retreat', result: 'retreat' }
        ]
    },
    treasure: {
        title: 'Buried Treasure!',
        text: 'Our scout noticed disturbed earth beneath a distinctive rock formation. There may be treasure buried here!',
        choices: [
            { text: 'Dig it up!', result: 'digTreasure' },
            { text: 'Mark location', result: 'markLocation' },
            { text: 'Leave it', result: 'leave' }
        ]
    },
    sickness: {
        title: 'Jungle Fever',
        text: 'A member of the expedition has fallen ill with jungle fever. They need rest and medicine.',
        choices: [
            { text: 'Use medicine', result: 'useMedicine' },
            { text: 'Rest and hope', result: 'restSick' },
            { text: 'Push on anyway', result: 'pushOnSick' }
        ]
    },
    portal: {
        title: 'Mystical Portal',
        text: 'A shimmering portal appears before us, showing glimpses of a distant location. It feels unstable.',
        choices: [
            { text: 'Step through', result: 'usePortal' },
            { text: 'Study it', result: 'studyPortal' },
            { text: 'Ignore it', result: 'leave' }
        ]
    }
};

// Achievements
const ACHIEVEMENTS = {
    firstPyramid: { name: 'Pyramid Found', desc: 'Found your first Golden Pyramid' },
    fiveExpeditions: { name: 'Seasoned Explorer', desc: 'Complete 5 expeditions' },
    noLosses: { name: 'Perfect Expedition', desc: 'Complete without losing party members' },
    richExplorer: { name: 'Fortune Seeker', desc: 'Collect 500 fame' },
    treasureHunter: { name: 'Treasure Hunter', desc: 'Find 10 treasures' },
    survivor: { name: 'Survivor', desc: 'Survive with less than 10 sanity' }
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

// Generate hex map (expanded with more variety)
function generateMap() {
    hexMap = [];
    locations = [];
    fogOfWar = [];
    visitedLocations = [];
    revealedSecrets = [];

    // Generate terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        hexMap[y] = [];
        fogOfWar[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const rand = Math.random();
            let terrain;
            if (rand < 0.30) terrain = 'grass';
            else if (rand < 0.48) terrain = 'jungle';
            else if (rand < 0.62) terrain = 'thickJungle';
            else if (rand < 0.72) terrain = 'desert';
            else if (rand < 0.80) terrain = 'swamp';
            else if (rand < 0.90) terrain = 'water';
            else terrain = 'mountain';

            hexMap[y][x] = terrain;
            fogOfWar[y][x] = true;
        }
    }

    // Set starting position
    party.x = 1;
    party.y = Math.floor(MAP_HEIGHT / 2);
    hexMap[party.y][party.x] = 'grass';
    hexMap[party.y][party.x + 1] = 'grass';

    // Place pyramid (far right)
    const pyramidX = MAP_WIDTH - 2;
    const pyramidY = Math.floor(MAP_HEIGHT / 2) + Math.floor(Math.random() * 3) - 1;
    locations.push({ x: pyramidX, y: pyramidY, type: 'pyramid' });
    hexMap[pyramidY][pyramidX] = 'grass';

    // Place other locations
    for (let i = 0; i < 3; i++) placeLocation('village');
    for (let i = 0; i < 2; i++) placeLocation('shrine');
    placeLocation('cave');
    placeLocation('oasis');
    placeLocation('ruins');
    placeLocation('tradingPost');
    if (Math.random() < 0.5) placeLocation('waterfall');
}

function placeLocation(type) {
    let attempts = 0;
    while (attempts < 50) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

        let valid = true;
        for (const loc of locations) {
            const dist = Math.abs(loc.x - x) + Math.abs(loc.y - y);
            if (dist < 3) { valid = false; break; }
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

// Draw the map / scene panel
function drawMap() {
    const isNight = game.day % 5 === 0;

    if (game.state === 'event' && currentEvent) {
        drawEventScene(currentEvent, isNight);
    } else {
        drawExplorationScene(isNight);
    }
}

function drawEventScene(eventType, isNight) {
    const sceneX = 520;
    const sceneW = 440;

    // Sky gradient with weather
    if (isNight) {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 400);
        gradient.addColorStop(0, '#0D0D1A');
        gradient.addColorStop(0.5, '#1A1A3E');
        gradient.addColorStop(1, '#2A2A4A');
        ctx.fillStyle = gradient;
    } else {
        const gradient = ctx.createLinearGradient(sceneX, 0, sceneX, 400);
        if (game.weather === 'rainy') {
            gradient.addColorStop(0, '#4A5A6A');
            gradient.addColorStop(1, '#6A7A8A');
        } else if (game.weather === 'cloudy') {
            gradient.addColorStop(0, '#7A9AAA');
            gradient.addColorStop(1, '#9ABACA');
        } else {
            gradient.addColorStop(0, '#4ECDC4');
            gradient.addColorStop(0.4, '#7DD8D8');
            gradient.addColorStop(1, '#A8E6CE');
        }
        ctx.fillStyle = gradient;
    }
    ctx.fillRect(sceneX, 0, sceneW, 640);

    // Weather particles
    if (game.weather === 'rainy') {
        drawRainParticles(sceneX, sceneW);
    }

    // Draw scene based on event type
    switch(eventType) {
        case 'village': drawVillageScene(sceneX, isNight); break;
        case 'shrine': drawShrineScene(sceneX, isNight); break;
        case 'pyramid': drawPyramidScene(sceneX, isNight); break;
        case 'cave': drawCaveScene(sceneX, isNight); break;
        case 'oasis': drawOasisScene(sceneX, isNight); break;
        case 'ruins': drawRuinsScene(sceneX, isNight); break;
        case 'tradingPost': drawTradingPostScene(sceneX, isNight); break;
        case 'waterfall': drawWaterfallScene(sceneX, isNight); break;
        case 'animalAttack': drawAnimalAttackScene(sceneX, isNight); break;
        case 'nativeEncounter': drawNativeEncounterScene(sceneX, isNight); break;
        case 'nightCamp':
        case 'lowSanity': drawCampScene(sceneX); break;
        default: drawJungleScene(sceneX, isNight);
    }
}

function drawExplorationScene(isNight) {
    const sceneX = 520;

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

    drawJungleScene(sceneX, isNight);
    drawMiniMap(sceneX + 20, 20);

    // Weather indicator
    drawWeatherIndicator(sceneX + 350, 30);
}

function drawWeatherIndicator(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, 60, 25);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    const weatherIcons = { clear: '☀️', cloudy: '☁️', rainy: '🌧️', foggy: '🌫️' };
    ctx.fillText(weatherIcons[game.weather] || '☀️', x + 30, y + 17);
}

function drawRainParticles(x, w) {
    ctx.strokeStyle = 'rgba(150, 180, 200, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
        const rx = x + Math.random() * w;
        const ry = Math.random() * 640;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 15);
        ctx.stroke();
    }
}

// Scene drawing functions
function drawVillageScene(x, isNight) {
    const treeColor = isNight ? '#1A4A2A' : '#2E7D32';
    const treeAnim = Math.sin(game.treeAnim) * 2;

    ctx.fillStyle = isNight ? '#1A3A2A' : '#3E8B4E';
    drawMountainRange(x, 80, 440, 100);

    for (let i = 0; i < 10; i++) {
        drawTree(x + 30 + i * 45, 150 + Math.sin(i) * 20 + treeAnim, 40 + Math.random() * 20, treeColor);
    }

    ctx.fillStyle = isNight ? '#2A4A2A' : '#5A8F3E';
    ctx.fillRect(x, 350, 440, 290);

    drawHut(x + 120, 320, 80, 70);
    drawHut(x + 250, 300, 100, 90);
    drawHut(x + 350, 340, 70, 60);

    drawPixelPerson(x + 180, 420, '#8B4513', '#B85450');
    drawPixelPerson(x + 280, 440, '#6B3A0A', '#4A90B8');

    drawExplorerSprite(x + 220, 450);
    drawDonkeySprite(x + 260, 460);
}

function drawPyramidScene(x, isNight) {
    const gradient = ctx.createLinearGradient(x, 0, x, 400);
    gradient.addColorStop(0, '#4ECDC4');
    gradient.addColorStop(0.5, '#7DD8D8');
    gradient.addColorStop(1, '#A8E6CE');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    ctx.fillStyle = '#FFFFFF';
    drawCloud(x + 80, 60, 50);
    drawCloud(x + 280, 40, 40);

    ctx.fillStyle = '#5A8A6E';
    drawMountainRange(x, 150, 440, 80);

    for (let i = 0; i < 15; i++) {
        drawTree(x + 20 + i * 30, 200 + Math.sin(i * 0.8) * 30, 50, '#2E7D32');
    }

    drawGoldenPyramid(x + 220, 120, 200, 250);

    ctx.fillStyle = '#5A8F3E';
    ctx.fillRect(x, 500, 440, 140);

    drawExplorerSprite(x + 200, 560);
    drawDonkeySprite(x + 160, 570);
}

function drawCampScene(x) {
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#0D0D1A');
    gradient.addColorStop(0.4, '#1A1A3E');
    gradient.addColorStop(1, '#2A3A4A');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
        const sx = x + Math.random() * 440;
        const sy = Math.random() * 300;
        const size = Math.random() < 0.1 ? 3 : 1;
        ctx.fillRect(sx, sy, size, size);
    }

    ctx.fillStyle = '#E8E8D0';
    ctx.beginPath();
    ctx.arc(x + 350, 80, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0A1520';
    for (let i = 0; i < 8; i++) {
        drawTreeSilhouette(x + 30 + i * 55, 280, 80 + Math.random() * 40);
    }

    ctx.fillStyle = '#1A2A2A';
    ctx.fillRect(x, 400, 440, 240);

    const glowGradient = ctx.createRadialGradient(x + 220, 480, 10, x + 220, 480, 120);
    glowGradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x + 100, 360, 240, 240);

    drawCampfire(x + 220, 480);

    drawExplorerSprite(x + 150, 470);
    drawPixelPerson(x + 280, 465, '#8B4513', '#4A6FA5');
    drawDonkeySprite(x + 320, 450);
}

function drawShrineScene(x, isNight) {
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

    const treeColor = isNight ? '#1A3A2A' : '#2E6D32';
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 150, 70, treeColor);
    }

    ctx.fillStyle = isNight ? '#2A3A2A' : '#4A7A4E';
    ctx.fillRect(x, 380, 440, 260);

    drawStoneShrine(x + 220, 300);

    const glowGradient = ctx.createRadialGradient(x + 220, 350, 20, x + 220, 350, 100);
    glowGradient.addColorStop(0, 'rgba(218, 165, 32, 0.3)');
    glowGradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x + 220, 350, 100, 0, Math.PI * 2);
    ctx.fill();

    drawExplorerSprite(x + 150, 480);
}

function drawCaveScene(x, isNight) {
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x, 0, 440, 640);

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

    const torchGradient = ctx.createRadialGradient(x + 150, 400, 20, x + 150, 400, 150);
    torchGradient.addColorStop(0, 'rgba(255, 150, 50, 0.5)');
    torchGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = torchGradient;
    ctx.fillRect(x, 250, 300, 300);

    drawExplorerSprite(x + 180, 450);

    ctx.fillStyle = '#FF9932';
    ctx.beginPath();
    ctx.ellipse(x + 195, 430, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawOasisScene(x, isNight) {
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#F4D03F');
    gradient.addColorStop(1, '#D4A559');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    ctx.fillStyle = '#D4A559';
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.quadraticCurveTo(x + 100, 250, x + 200, 300);
    ctx.quadraticCurveTo(x + 300, 350, x + 440, 280);
    ctx.lineTo(x + 440, 640);
    ctx.lineTo(x, 640);
    ctx.fill();

    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.ellipse(x + 220, 450, 100, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPalmTree(x + 150, 380, 80);
    drawPalmTree(x + 280, 370, 90);
    drawPalmTree(x + 320, 400, 60);

    drawExplorerSprite(x + 200, 500);
    drawDonkeySprite(x + 250, 510);
}

function drawRuinsScene(x, isNight) {
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#5A7A6A');
    gradient.addColorStop(1, '#4A6A5A');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    for (let i = 0; i < 10; i++) {
        drawTree(x + 20 + i * 45, 120, 60, '#2E6D32');
    }

    ctx.fillStyle = '#4A5A4A';
    ctx.fillRect(x, 350, 440, 290);

    // Ruined pillars
    ctx.fillStyle = '#7A7A6A';
    ctx.fillRect(x + 100, 280, 30, 150);
    ctx.fillRect(x + 200, 300, 35, 130);
    ctx.fillRect(x + 300, 270, 28, 160);

    // Broken arch
    ctx.beginPath();
    ctx.arc(x + 220, 280, 80, Math.PI, Math.PI * 1.7);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#6A6A5A';
    ctx.stroke();

    // Vines
    ctx.strokeStyle = '#3A6A3A';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 100 + i * 70, 280);
        ctx.quadraticCurveTo(x + 110 + i * 70, 350, x + 90 + i * 70, 430);
        ctx.stroke();
    }

    drawExplorerSprite(x + 220, 480);
}

function drawTradingPostScene(x, isNight) {
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#7AA89E');
    gradient.addColorStop(1, '#5A887E');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    ctx.fillStyle = '#5A8F3E';
    ctx.fillRect(x, 350, 440, 290);

    // Trading post building
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 150, 280, 140, 120);

    // Roof
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.moveTo(x + 140, 280);
    ctx.lineTo(x + 220, 220);
    ctx.lineTo(x + 300, 280);
    ctx.fill();

    // Sign
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(x + 180, 245, 80, 25);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('TRADING POST', x + 220, 262);

    // Crates
    ctx.fillStyle = '#6B5B4F';
    ctx.fillRect(x + 310, 380, 40, 30);
    ctx.fillRect(x + 320, 350, 35, 30);

    drawExplorerSprite(x + 200, 450);
}

function drawWaterfallScene(x, isNight) {
    const gradient = ctx.createLinearGradient(x, 0, x, 640);
    gradient.addColorStop(0, '#5ACFC4');
    gradient.addColorStop(1, '#4A8F8E');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 440, 640);

    // Cliff
    ctx.fillStyle = '#6A5A4A';
    ctx.fillRect(x + 180, 0, 80, 300);

    // Waterfall
    ctx.fillStyle = '#6ECFEA';
    ctx.fillRect(x + 195, 0, 50, 400);

    // Mist particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
        const mx = x + 180 + Math.random() * 80;
        const my = 350 + Math.random() * 100;
        ctx.beginPath();
        ctx.arc(mx, my, 5 + Math.random() * 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pool
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.ellipse(x + 220, 480, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rainbow
    const rainbowGradient = ctx.createLinearGradient(x + 100, 300, x + 340, 300);
    rainbowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    rainbowGradient.addColorStop(0.17, 'rgba(255, 127, 0, 0.3)');
    rainbowGradient.addColorStop(0.33, 'rgba(255, 255, 0, 0.3)');
    rainbowGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
    rainbowGradient.addColorStop(0.67, 'rgba(0, 0, 255, 0.3)');
    rainbowGradient.addColorStop(0.83, 'rgba(75, 0, 130, 0.3)');
    rainbowGradient.addColorStop(1, 'rgba(148, 0, 211, 0.3)');
    ctx.strokeStyle = rainbowGradient;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x + 220, 450, 100, Math.PI, 0);
    ctx.stroke();

    drawExplorerSprite(x + 150, 520);
}

function drawAnimalAttackScene(x, isNight) {
    drawJungleScene(x, isNight);

    // Big cat/predator
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 280, 440, 60, 30);
    ctx.fillRect(x + 320, 420, 25, 25);

    // Eyes
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x + 328, 430, 4, 0, Math.PI * 2);
    ctx.arc(x + 340, 430, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 280, 455);
    ctx.quadraticCurveTo(x + 260, 440, x + 250, 460);
    ctx.stroke();

    drawExplorerSprite(x + 180, 460);
}

function drawNativeEncounterScene(x, isNight) {
    drawJungleScene(x, isNight);

    // Warriors
    for (let i = 0; i < 4; i++) {
        drawPixelPerson(x + 260 + i * 35, 440 + Math.sin(i) * 10, '#6B3A0A', '#B85450');
        // Spears
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x + 265 + i * 35, 400, 3, 50);
        ctx.fillStyle = '#7A7A7A';
        ctx.beginPath();
        ctx.moveTo(x + 263 + i * 35, 400);
        ctx.lineTo(x + 266.5 + i * 35, 385);
        ctx.lineTo(x + 270 + i * 35, 400);
        ctx.fill();
    }

    drawExplorerSprite(x + 180, 450);
}

function drawJungleScene(x, isNight) {
    const treeAnim = Math.sin(game.treeAnim) * 2;

    if (!isNight) {
        const gradient = ctx.createLinearGradient(x, 0, x, 300);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(1, '#7DD8D8');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 440, 640);
    }

    const bgTreeColor = isNight ? '#1A3A2A' : '#3E8B4E';
    for (let i = 0; i < 12; i++) {
        drawTree(x + 20 + i * 38, 120 + Math.sin(i) * 30 + treeAnim * 0.5, 60, bgTreeColor);
    }

    const midTreeColor = isNight ? '#1A4A2A' : '#2E7D32';
    for (let i = 0; i < 10; i++) {
        drawTree(x + 10 + i * 45, 200 + Math.cos(i) * 20 + treeAnim, 70, midTreeColor);
    }

    ctx.fillStyle = isNight ? '#1A3A2A' : '#4A8A4E';
    ctx.fillRect(x, 400, 440, 240);

    const fgTreeColor = isNight ? '#0A2A1A' : '#1B5E20';
    for (let i = 0; i < 6; i++) {
        drawTree(x + i * 80, 500, 100, fgTreeColor);
    }

    drawExplorerSprite(x + 220, 480);
    drawDonkeySprite(x + 180, 490);
}

// Helper drawing functions
function drawTree(x, y, height, foliageColor) {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 5, y, 10, height * 0.3);

    ctx.fillStyle = foliageColor;
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
    ctx.fillStyle = '#C4A35A';
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y - height * 0.4);
    ctx.lineTo(x - width * 0.1, y + height * 0.3);
    ctx.lineTo(x + width * 1.1, y + height * 0.3);
    ctx.fill();

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y + height * 0.3, width, height * 0.5);

    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + width * 0.4, y + height * 0.45, width * 0.2, height * 0.35);
}

function drawGoldenPyramid(x, y, width, height) {
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - width / 2, y + height);
    ctx.lineTo(x + width / 2, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

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

    ctx.fillStyle = '#2A1A0A';
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.6);
    ctx.lineTo(x - width * 0.08, y + height);
    ctx.lineTo(x + width * 0.08, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawStoneShrine(x, y) {
    ctx.fillStyle = '#6A6A5A';
    ctx.fillRect(x - 60, y + 60, 120, 30);

    ctx.fillStyle = '#7A7A6A';
    ctx.fillRect(x - 50, y - 20, 20, 80);
    ctx.fillRect(x + 30, y - 20, 20, 80);

    ctx.fillRect(x - 55, y - 35, 110, 20);

    ctx.fillStyle = '#5A5A4A';
    ctx.fillRect(x - 20, y + 20, 40, 40);

    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(x, y + 30, 12, 0, Math.PI * 2);
    ctx.fill();
}

function drawPalmTree(x, y, height) {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x - 6, y, 12, height);

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
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 25, y + 5, 50, 10);

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
}

function drawPixelPerson(x, y, skinColor, clothColor) {
    ctx.fillStyle = skinColor;
    ctx.fillRect(x - 4, y - 20, 8, 8);

    ctx.fillStyle = clothColor;
    ctx.fillRect(x - 5, y - 12, 10, 12);

    ctx.fillStyle = skinColor;
    ctx.fillRect(x - 4, y, 3, 8);
    ctx.fillRect(x + 1, y, 3, 8);
}

function drawExplorerSprite(x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 10, y - 28, 20, 4);
    ctx.fillRect(x - 6, y - 35, 12, 8);

    ctx.fillStyle = '#E8B89D';
    ctx.fillRect(x - 5, y - 24, 10, 10);

    ctx.fillStyle = '#4A6FA5';
    ctx.fillRect(x - 6, y - 14, 12, 14);

    ctx.fillStyle = '#C4A35A';
    ctx.fillRect(x - 5, y, 4, 10);
    ctx.fillRect(x + 1, y, 4, 10);

    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x - 5, y + 8, 4, 4);
    ctx.fillRect(x + 1, y + 8, 4, 4);
}

function drawDonkeySprite(x, y) {
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x - 12, y - 8, 24, 14);

    ctx.fillRect(x - 18, y - 12, 10, 10);

    ctx.fillRect(x - 18, y - 18, 3, 8);
    ctx.fillRect(x - 12, y - 18, 3, 8);

    ctx.fillRect(x - 10, y + 6, 4, 10);
    ctx.fillRect(x + 6, y + 6, 4, 10);

    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 8, y - 14, 16, 8);
}

function drawMiniMap(x, y) {
    const miniSize = 6;
    const padding = 8;
    const mapW = MAP_WIDTH * miniSize + padding * 2;
    const mapH = MAP_HEIGHT * miniSize + padding * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, mapW, mapH);

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, mapW, mapH);

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

    for (const loc of locations) {
        if (!fogOfWar[loc.y][loc.x]) {
            const px = x + padding + loc.x * miniSize;
            const py = y + padding + loc.y * miniSize;
            ctx.fillStyle = loc.type === 'pyramid' ? '#FFD700' : '#FFFFFF';
            ctx.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
    }

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

// Draw the journal
function drawJournal() {
    ctx.fillStyle = COLORS.leatherDark;
    ctx.fillRect(40, 40, 25, 560);
    ctx.fillStyle = COLORS.leather;
    ctx.fillRect(50, 45, 15, 550);

    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(65, 50, 435, 540);

    ctx.fillStyle = COLORS.parchmentDark;
    for (let i = 0; i < 20; i++) {
        const px = 70 + Math.random() * 420;
        const py = 55 + Math.random() * 530;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(px, py, Math.random() * 30 + 10, Math.random() * 3 + 1);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 60, 415, 520);

    ctx.fillStyle = '#8A8A7A';
    ctx.fillRect(495, 150, 12, 25);
    ctx.fillRect(495, 400, 12, 25);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'italic 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Day ${journalDay}`, 282, 100);

    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 115);
    ctx.lineTo(420, 115);
    ctx.stroke();

    ctx.font = '16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.inkBrown;
    wrapText(journalText, 95, 150, 380, 24);

    if (game.state === 'event' && eventChoices.length > 0) {
        drawEventChoices();
    }

    drawStatusBar();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

function drawEventChoices() {
    const startY = 350;
    const buttonWidth = 380;
    const buttonHeight = 42;
    const gap = 10;

    for (let i = 0; i < eventChoices.length; i++) {
        const y = startY + i * (buttonHeight + gap);
        const isHovered = selectedChoice === i;

        ctx.fillStyle = isHovered ? '#5A4738' : COLORS.buttonBg;
        ctx.fillRect(95, y, buttonWidth, buttonHeight);

        ctx.strokeStyle = COLORS.goldAccent;
        ctx.lineWidth = 2;
        drawCorner(95, y, 12, false, false);
        drawCorner(95 + buttonWidth, y, 12, true, false);
        drawCorner(95, y + buttonHeight, 12, false, true);
        drawCorner(95 + buttonWidth, y + buttonHeight, 12, true, true);

        ctx.fillStyle = COLORS.parchment;
        ctx.font = '16px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${eventChoices[i].text}`, 115, y + 26);
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

    ctx.beginPath();
    ctx.moveTo(x + dx * 4, y + dy * (size - 4));
    ctx.lineTo(x + dx * 4, y + dy * 4);
    ctx.lineTo(x + dx * (size - 4), y + dy * 4);
    ctx.stroke();
}

function drawStatusBar() {
    const barY = 545;

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Sanity:', 95, barY);

    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(150, barY - 12, 150, 16);

    const sanityPercent = party.sanity / party.maxSanity;
    ctx.fillStyle = sanityPercent > 0.5 ? COLORS.sanityBlue :
                    sanityPercent > 0.25 ? '#D4A559' : COLORS.dangerRed;
    ctx.fillRect(150, barY - 12, 150 * sanityPercent, 16);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${party.sanity}/${party.maxSanity}`, 225, barY);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Party:', 320, barY);

    let iconX = 365;
    for (const member of party.members) {
        if (member.health > 0) {
            if (member.type === 'explorer') ctx.fillStyle = '#4A6FA5';
            else if (member.type === 'scout') ctx.fillStyle = '#8B4513';
            else ctx.fillStyle = '#8B7355';

            ctx.beginPath();
            ctx.arc(iconX, barY - 5, 8, 0, Math.PI * 2);
            ctx.fill();

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

// Spawn effects
function screenShake(amount) {
    game.screenShake = Math.max(game.screenShake, amount);
}

function screenFlash(color, alpha) {
    game.screenFlash = color;
    game.flashAlpha = alpha;
}

function spawnFloatingText(text, x, y, color) {
    game.floatingTexts.push({ text, x, y, vy: -30, life: 1.5, color });
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60 - 30,
            color,
            life: 1.0,
            size: 2 + Math.random() * 3
        });
    }
}

function unlockAchievement(id) {
    if (!game.achievements.includes(id) && ACHIEVEMENTS[id]) {
        game.achievements.push(id);
        spawnFloatingText(`🏆 ${ACHIEVEMENTS[id].name}`, 450, 100, '#FFD700');
    }
}

// Event handlers
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
        const startY = 350;
        const buttonWidth = 380;
        const buttonHeight = 42;
        const gap = 10;

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
        if (x > 520) {
            const neighbors = getNeighbors(party.x, party.y);
            const validMoves = neighbors.filter(n => {
                if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) return false;
                const terrain = TERRAIN_TYPES[hexMap[n.y][n.x]];
                return terrain.passable;
            });

            if (validMoves.length > 0) {
                validMoves.sort((a, b) => b.x - a.x);
                const targetHex = validMoves[0];
                moveParty(targetHex.x, targetHex.y);
            }
        }
    }

    if (game.state === 'victory' || game.state === 'gameOver') {
        party.sanity = 100;
        party.members = [
            { name: 'Explorer', type: 'explorer', health: 3, maxHealth: 3, ability: 'Navigate' },
            { name: 'Native Scout', type: 'scout', health: 2, maxHealth: 2, ability: 'Track' },
            { name: 'Pack Donkey', type: 'animal', health: 2, maxHealth: 2, cargo: 3 }
        ];
        party.inventory = ['Torch', 'Rope', 'Whiskey'];
        party.blessings = [];
        party.curses = [];
        party.treasureFound = 0;
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
        const buttonHeight = 42;
        const gap = 10;

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
    let cost = terrain.cost + 3;

    // Weather effects
    if (game.weather === 'rainy') cost += 2;
    if (game.weather === 'foggy') cost += 1;

    // Scout ability reduces travel cost
    const scout = party.members.find(m => m.type === 'scout' && m.health > 0);
    if (scout) cost = Math.max(1, cost - 2);

    party.sanity = Math.max(0, party.sanity - cost);
    party.x = toX;
    party.y = toY;
    game.day++;
    journalDay = game.day;

    revealFog(toX, toY);

    // Check for location
    const location = locations.find(l => l.x === toX && l.y === toY);
    if (location) {
        if (!visitedLocations.includes(`${toX},${toY}`)) {
            visitedLocations.push(`${toX},${toY}`);
        }
        triggerEvent(location.type);
        return;
    }

    // Random events
    if (party.sanity <= 20 && Math.random() < 0.3) {
        triggerEvent('lowSanity');
        return;
    }

    if (Math.random() < 0.08) {
        triggerEvent('animalAttack');
        return;
    }

    if (Math.random() < 0.06) {
        triggerEvent('nativeEncounter');
        return;
    }

    if (Math.random() < 0.05) {
        triggerEvent('treasure');
        return;
    }

    if (Math.random() < 0.04 && game.expedition > 1) {
        triggerEvent('portal');
        return;
    }

    if (Math.random() < 0.12) {
        triggerEvent('nightCamp');
        return;
    }

    journalText = `Day ${game.day}. We traveled through the ${terrain.name.toLowerCase()}. The journey cost us ${cost} sanity.`;

    // Check game over
    if (party.sanity <= 0) {
        const explorer = party.members.find(m => m.type === 'explorer');
        if (explorer) {
            explorer.health--;
            party.sanity = 20;
            journalText = 'Madness! The expedition leader collapsed from exhaustion.';
            screenShake(10);
            screenFlash('#FF0000', 0.4);

            if (explorer.health <= 0) {
                game.state = 'gameOver';
                journalText = 'The expedition has ended in tragedy. The explorer perished in the wilderness.';
            }
        }
    }

    // Check survivor achievement
    if (party.sanity < 10 && party.sanity > 0) {
        unlockAchievement('survivor');
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
            journalText = 'We rested in the village. (+20 Sanity)';
            spawnParticles(400, 300, '#4A90B8', 10);
            break;

        case 'hireGuide':
            if (party.members.length < 5) {
                party.members.push({ name: 'Village Guide', type: 'scout', health: 2, maxHealth: 2, ability: 'Local Knowledge' });
                journalText = 'A local villager agreed to guide us. (+1 Scout)';
            } else {
                journalText = 'Our party is already full.';
            }
            break;

        case 'investigate':
            if (Math.random() < 0.6) {
                party.sanity = Math.min(party.maxSanity, party.sanity + 10);
                journalText = 'The shrine contained ancient wisdom. (+10 Sanity)';
            } else {
                party.sanity = Math.max(0, party.sanity - 15);
                journalText = 'The shrine was cursed! (-15 Sanity)';
                screenFlash('#800080', 0.4);
            }
            break;

        case 'offering':
            if (party.inventory.length > 0) {
                const item = party.inventory.pop();
                party.sanity = Math.min(party.maxSanity, party.sanity + 30);
                party.blessings.push('Protection');
                journalText = `We offered our ${item} to the shrine. (+30 Sanity, +Blessing)`;
                spawnParticles(400, 300, '#FFD700', 15);
            } else {
                journalText = 'We had nothing to offer.';
            }
            break;

        case 'pray':
            if (Math.random() < 0.4) {
                party.blessings.push('Fortune');
                journalText = 'The spirits heard our prayers. (+Blessing)';
                spawnParticles(400, 300, '#DAA520', 20);
            } else {
                journalText = 'Our prayers went unanswered.';
            }
            break;

        case 'enterPyramid':
            pyramidFound = true;
            game.fame += 100;
            game.state = 'victory';
            unlockAchievement('firstPyramid');
            if (game.expedition >= 5) unlockAchievement('fiveExpeditions');
            if (!party.members.some(m => m.health < m.maxHealth)) unlockAchievement('noLosses');
            if (game.fame >= 500) unlockAchievement('richExplorer');
            journalText = `SUCCESS! We entered the Golden Pyramid! Expedition ${game.expedition} complete. Fame: +100`;
            spawnParticles(740, 300, '#FFD700', 30);
            return;

        case 'searchSecret':
            if (Math.random() < 0.3) {
                party.inventory.push('Ancient Map');
                journalText = 'We found a secret passage with an ancient map!';
                party.treasureFound++;
            } else {
                journalText = 'We found no secret entrance.';
            }
            break;

        case 'exploreCave':
            if (Math.random() < 0.5) {
                party.inventory.push('Gold Idol');
                party.treasureFound++;
                journalText = 'We found a golden idol! (+Gold Idol)';
                spawnParticles(400, 300, '#DAA520', 10);
                if (party.treasureFound >= 10) unlockAchievement('treasureHunter');
            } else {
                const member = party.members.find(m => m.health > 0 && m.type !== 'explorer');
                if (member) {
                    member.health--;
                    journalText = `A creature attacked! ${member.name} was wounded.`;
                    screenShake(8);
                    screenFlash('#FF0000', 0.3);
                } else {
                    party.sanity = Math.max(0, party.sanity - 20);
                    journalText = 'A creature attacked! (-20 Sanity)';
                }
            }
            break;

        case 'searchEntrance':
            if (Math.random() < 0.4) {
                party.inventory.push('Gems');
                journalText = 'We found some gems near the entrance!';
            } else {
                journalText = 'We found nothing of value.';
            }
            break;

        case 'oasisRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 30);
            journalText = 'The oasis provided much needed rest. (+30 Sanity)';
            spawnParticles(400, 300, '#4ECDC4', 15);
            break;

        case 'fillWater':
            party.inventory.push('Water');
            party.inventory.push('Water');
            journalText = 'We filled our canteens. (+2 Water)';
            break;

        case 'searchHerbs':
            if (Math.random() < 0.6) {
                party.inventory.push('Healing Herbs');
                journalText = 'We found medicinal herbs!';
            } else {
                journalText = 'No useful herbs were found.';
            }
            break;

        case 'excavate':
            if (Math.random() < 0.5) {
                party.inventory.push('Ancient Artifact');
                party.treasureFound++;
                game.fame += 20;
                journalText = 'We excavated an ancient artifact! (+20 Fame)';
                spawnParticles(400, 300, '#9A7A5A', 12);
            } else {
                party.sanity = Math.max(0, party.sanity - 10);
                journalText = 'The excavation revealed nothing but dust. (-10 Sanity)';
            }
            break;

        case 'study':
            party.sanity = Math.min(party.maxSanity, party.sanity + 15);
            journalText = 'The inscriptions revealed ancient knowledge. (+15 Sanity)';
            break;

        case 'campRuins':
            party.sanity = Math.min(party.maxSanity, party.sanity + 10);
            game.day++;
            journalText = 'We camped in the ruins. (+10 Sanity)';
            break;

        case 'buySupplies':
            if (party.inventory.length < party.maxInventory) {
                party.inventory.push('Supplies');
                party.inventory.push('Medicine');
                journalText = 'We purchased supplies and medicine.';
            } else {
                journalText = 'Our inventory is full!';
            }
            break;

        case 'sellTreasures':
            const treasures = party.inventory.filter(i => ['Gold Idol', 'Ancient Artifact', 'Gems'].includes(i));
            if (treasures.length > 0) {
                game.fame += treasures.length * 15;
                party.inventory = party.inventory.filter(i => !['Gold Idol', 'Ancient Artifact', 'Gems'].includes(i));
                journalText = `We sold ${treasures.length} treasures! (+${treasures.length * 15} Fame)`;
            } else {
                journalText = 'We have no treasures to sell.';
            }
            break;

        case 'gatherIntel':
            journalText = 'The traders shared rumors about the pyramid location.';
            // Could reveal more fog of war around pyramid
            break;

        case 'bathe':
            party.sanity = Math.min(party.maxSanity, party.sanity + 25);
            // Heal a wounded member
            const wounded = party.members.find(m => m.health < m.maxHealth);
            if (wounded) {
                wounded.health = Math.min(wounded.maxHealth, wounded.health + 1);
                journalText = 'The sacred waters healed our wounds. (+25 Sanity, +1 Health)';
            } else {
                journalText = 'The sacred waters refreshed us. (+25 Sanity)';
            }
            spawnParticles(400, 300, '#6ECFEA', 15);
            break;

        case 'searchWaterfall':
            if (Math.random() < 0.4) {
                party.inventory.push('Crystal Gem');
                party.treasureFound++;
                journalText = 'Behind the waterfall we found a crystal gem!';
                spawnParticles(400, 300, '#AAFFFF', 10);
            } else {
                party.sanity = Math.max(0, party.sanity - 5);
                journalText = 'Nothing but wet rocks behind the falls. (-5 Sanity)';
            }
            break;

        case 'fightAnimal':
            if (Math.random() < 0.6 + party.combatBonus) {
                journalText = 'We fought off the predator!';
                game.fame += 5;
            } else {
                const victim = party.members.find(m => m.health > 0 && m.type !== 'explorer');
                if (victim) {
                    victim.health--;
                    journalText = `The predator wounded ${victim.name}!`;
                } else {
                    const explorer = party.members.find(m => m.type === 'explorer');
                    if (explorer) explorer.health--;
                    journalText = 'The predator wounded the explorer!';
                }
                screenShake(10);
                screenFlash('#FF0000', 0.4);
            }
            break;

        case 'fleeAnimal':
            if (party.inventory.length > 0) {
                party.inventory.pop();
                journalText = 'We fled, dropping supplies in our escape.';
            } else {
                journalText = 'We fled successfully.';
            }
            break;

        case 'negotiate':
            if (Math.random() < 0.5) {
                journalText = 'We negotiated safe passage.';
            } else {
                party.sanity = Math.max(0, party.sanity - 10);
                journalText = 'Negotiations failed. We were forced to flee. (-10 Sanity)';
            }
            break;

        case 'offerGifts':
            if (party.inventory.length > 0) {
                party.inventory.pop();
                journalText = 'They accepted our gift and let us pass in peace.';
            } else {
                journalText = 'We had nothing to offer and had to flee.';
            }
            break;

        case 'fightNatives':
            if (Math.random() < 0.4 + party.combatBonus) {
                journalText = 'We won the skirmish!';
                game.fame += 10;
            } else {
                const victim = party.members.find(m => m.health > 0);
                if (victim) {
                    victim.health--;
                    journalText = `We were defeated. ${victim.name} was wounded.`;
                }
                screenShake(12);
                screenFlash('#FF0000', 0.5);
            }
            break;

        case 'retreat':
            party.sanity = Math.max(0, party.sanity - 5);
            journalText = 'We retreated carefully. (-5 Sanity)';
            break;

        case 'digTreasure':
            if (Math.random() < 0.7) {
                const treasureType = Math.random() < 0.5 ? 'Gold Coins' : 'Jeweled Box';
                party.inventory.push(treasureType);
                party.treasureFound++;
                journalText = `We found ${treasureType}!`;
                spawnParticles(400, 300, '#DAA520', 12);
                if (party.treasureFound >= 10) unlockAchievement('treasureHunter');
            } else {
                party.sanity = Math.max(0, party.sanity - 5);
                journalText = 'The hole was empty. (-5 Sanity)';
            }
            break;

        case 'markLocation':
            journalText = 'We marked the location on our map for later.';
            break;

        case 'useMedicine':
            const medicine = party.inventory.indexOf('Medicine');
            if (medicine >= 0) {
                party.inventory.splice(medicine, 1);
                const sick = party.members.find(m => m.health < m.maxHealth);
                if (sick) sick.health = Math.min(sick.maxHealth, sick.health + 1);
                journalText = 'The medicine helped with recovery.';
            } else {
                journalText = 'We have no medicine!';
            }
            break;

        case 'restSick':
            game.day += 2;
            journalDay = game.day;
            if (Math.random() < 0.5) {
                journalText = 'After two days rest, the sickness passed.';
            } else {
                const victim = party.members.find(m => m.health > 0 && m.type !== 'explorer');
                if (victim) {
                    victim.health--;
                    journalText = `${victim.name} succumbed to the fever.`;
                }
            }
            break;

        case 'pushOnSick':
            party.sanity = Math.max(0, party.sanity - 15);
            journalText = 'We pushed on despite the illness. (-15 Sanity)';
            break;

        case 'usePortal':
            // Teleport closer to pyramid
            const pyramidLoc = locations.find(l => l.type === 'pyramid');
            if (pyramidLoc) {
                party.x = Math.max(0, pyramidLoc.x - 2);
                party.y = pyramidLoc.y;
                revealFog(party.x, party.y);
                journalText = 'The portal transported us closer to our goal!';
                spawnParticles(400, 300, '#AA00FF', 20);
            }
            break;

        case 'studyPortal':
            party.sanity = Math.min(party.maxSanity, party.sanity + 5);
            journalText = 'We studied the portal but dared not enter. (+5 Sanity)';
            break;

        case 'pushOn':
            party.sanity = Math.max(0, party.sanity - 10);
            journalText = 'We pushed on despite exhaustion. (-10 Sanity)';
            break;

        case 'camp':
        case 'campRest':
            party.sanity = Math.min(party.maxSanity, party.sanity + 15);
            game.day++;
            journalDay = game.day;
            journalText = 'We made camp and rested. (+15 Sanity)';
            break;

        case 'watch':
            if (Math.random() < 0.3) {
                journalText = 'Our vigilance was rewarded - we spotted danger and avoided it.';
            } else {
                journalText = 'The night passed without incident.';
            }
            break;

        case 'stories':
            party.sanity = Math.min(party.maxSanity, party.sanity + 10);
            journalText = 'The stories lifted our spirits. (+10 Sanity)';
            break;

        case 'leave':
        default:
            journalText = `Day ${game.day}. We decided to move on.`;
            break;
    }

    eventChoices = [];
    currentEvent = null;
    game.state = 'map';
}

// Draw screens
function drawTitleScreen() {
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(200, 150, 560, 340);

    ctx.strokeStyle = COLORS.leather;
    ctx.lineWidth = 8;
    ctx.strokeRect(200, 150, 560, 340);

    ctx.strokeStyle = COLORS.goldAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(215, 165, 530, 310);

    ctx.fillStyle = COLORS.inkBrown;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CURIOUS', 480, 240);
    ctx.fillText('EXPEDITION', 480, 295);

    ctx.font = 'italic 20px Georgia';
    ctx.fillText('A Victorian Exploration Adventure', 480, 340);

    ctx.font = '18px Georgia';
    ctx.fillText('Click anywhere to begin your expedition', 480, 420);

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
    ctx.fillText(`Treasures: ${party.treasureFound}`, 740, 360);
    ctx.font = '18px Georgia';
    ctx.fillText('Click for next expedition', 740, 410);
}

// Update effects
function updateEffects(dt) {
    // Tree animation
    game.treeAnim += dt * 2;

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

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 50 * dt;
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

    // Weather timer
    game.weatherTimer -= dt;
    if (game.weatherTimer <= 0) {
        game.weatherTimer = 30 + Math.random() * 30;
        game.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    }
}

// Draw effects
function drawEffects() {
    // Particles
    for (const p of game.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const t of game.floatingTexts) {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    // Screen flash
    if (game.flashAlpha > 0) {
        ctx.fillStyle = game.screenFlash;
        ctx.globalAlpha = game.flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    updateEffects(dt);

    ctx.save();

    // Screen shake
    if (game.screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * game.screenShake,
            (Math.random() - 0.5) * game.screenShake
        );
    }

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

    ctx.restore();

    drawEffects();

    requestAnimationFrame(gameLoop);
}

// Start the game
init();
