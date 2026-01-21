// X-COM Classic Clone - PixiJS Implementation
// Turn-based tactical strategy inspired by UFO: Enemy Unknown

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2a,
    antialias: true
});
document.body.appendChild(app.view);

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const TU_WALK = 4;
const TU_DIFFICULT = 6;
const TU_TURN = 1;
const TU_KNEEL = 4;
const TU_STAND = 8;

// Game state
const gameState = {
    state: 'menu', // menu, player_turn, enemy_turn, gameover
    turn: 1,
    selectedUnit: null,
    soldiers: [],
    aliens: [],
    map: [],
    fogOfWar: [],
    visibleTiles: new Set(),
    ufo: null,
    actionMode: 'move', // move, shoot, throw
    path: [],
    targetTile: null,
    message: '',
    messageTimer: 0,
    camera: { x: 0, y: 0 },
    animating: false,
    winner: null
};

// Containers
const worldContainer = new PIXI.Container();
const mapContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const fogContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const pathContainer = new PIXI.Container();

worldContainer.addChild(mapContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(pathContainer);
worldContainer.addChild(fogContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);

// Terrain types
const TERRAIN = {
    GRASS: { tu: 4, cover: 0, color: 0x2d5a27, destructible: false },
    DIRT: { tu: 4, cover: 0, color: 0x5a4a3a, destructible: false },
    FOREST: { tu: 6, cover: 0.3, color: 0x1a4a17, destructible: true },
    WALL: { tu: 999, cover: 1, color: 0x555566, destructible: true, blocks: true },
    RUBBLE: { tu: 6, cover: 0.2, color: 0x666666, destructible: false },
    UFO_FLOOR: { tu: 4, cover: 0, color: 0x334455, destructible: false },
    UFO_WALL: { tu: 999, cover: 1, color: 0x223344, destructible: false, blocks: true }
};

// Unit class
class Unit {
    constructor(x, y, isAlien, type) {
        this.x = x;
        this.y = y;
        this.isAlien = isAlien;
        this.type = type;
        this.alive = true;
        this.kneeling = false;
        this.facing = isAlien ? Math.PI : 0;

        if (isAlien) {
            this.initAlien(type);
        } else {
            this.initSoldier(type);
        }

        this.currentTU = this.maxTU;
        this.currentHP = this.maxHP;
        this.morale = 100;

        this.createSprite();
    }

    initSoldier(type) {
        const names = ['Pvt. Smith', 'Cpl. Jones', 'Sgt. Brown', 'Lt. Davis'];
        this.name = names[type] || 'Rookie';

        // Randomize stats slightly
        this.maxTU = 50 + Math.floor(Math.random() * 15);
        this.maxHP = 30 + Math.floor(Math.random() * 10);
        this.reactions = 40 + Math.floor(Math.random() * 20);
        this.accuracy = 50 + Math.floor(Math.random() * 25);
        this.bravery = 30 + Math.floor(Math.random() * 40);

        this.weapon = type === 0 ? 'rifle' : (type === 1 ? 'rifle' : (type === 2 ? 'pistol' : 'rifle'));
        this.grenades = 2;
        this.ammo = this.weapon === 'rifle' ? 20 : 12;
    }

    initAlien(type) {
        const stats = {
            sectoid: { name: 'Sectoid', hp: 30, tu: 54, reactions: 63, accuracy: 60, color: 0x88aa88 },
            floater: { name: 'Floater', hp: 40, tu: 55, reactions: 55, accuracy: 50, color: 0x8888aa },
            snakeman: { name: 'Snakeman', hp: 50, tu: 45, reactions: 45, accuracy: 55, color: 0xaa8888 }
        };

        const s = stats[type] || stats.sectoid;
        this.name = s.name;
        this.maxHP = s.hp;
        this.maxTU = s.tu;
        this.reactions = s.reactions;
        this.accuracy = s.accuracy;
        this.bravery = 80;
        this.alienColor = s.color;
        this.weapon = 'plasma';
    }

    createSprite() {
        this.sprite = new PIXI.Container();

        // Body
        this.body = new PIXI.Graphics();
        this.redrawBody();
        this.sprite.addChild(this.body);

        // Selection indicator
        this.selection = new PIXI.Graphics();
        this.selection.lineStyle(2, 0xffff00);
        this.selection.drawCircle(0, 0, 14);
        this.selection.visible = false;
        this.sprite.addChild(this.selection);

        // HP bar
        this.hpBar = new PIXI.Graphics();
        this.sprite.addChild(this.hpBar);

        this.updateSprite();
        entityContainer.addChild(this.sprite);
    }

    redrawBody() {
        this.body.clear();

        const color = this.isAlien ? this.alienColor : 0x4488ff;
        const height = this.kneeling ? 10 : 14;

        this.body.beginFill(color);
        this.body.drawEllipse(0, 0, 10, height);
        this.body.endFill();

        // Facing indicator
        this.body.beginFill(0xffffff);
        this.body.drawCircle(Math.cos(this.facing) * 8, Math.sin(this.facing) * 8, 3);
        this.body.endFill();

        // Weapon
        if (!this.isAlien) {
            this.body.beginFill(0x333333);
            this.body.drawRect(Math.cos(this.facing) * 5 - 2, Math.sin(this.facing) * 5 - 1, 10, 3);
            this.body.endFill();
        }
    }

    updateSprite() {
        this.sprite.x = this.x * TILE_SIZE + TILE_SIZE / 2;
        this.sprite.y = this.y * TILE_SIZE + TILE_SIZE / 2;

        // Update HP bar
        this.hpBar.clear();
        this.hpBar.beginFill(0x440000);
        this.hpBar.drawRect(-12, -20, 24, 4);
        this.hpBar.endFill();
        this.hpBar.beginFill(this.isAlien ? 0xff4444 : 0x44ff44);
        this.hpBar.drawRect(-12, -20, 24 * (this.currentHP / this.maxHP), 4);
        this.hpBar.endFill();

        this.selection.visible = gameState.selectedUnit === this;
    }

    canSee(targetX, targetY) {
        // Check if target is in vision cone and not blocked
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 15) return false; // Vision range

        // Check angle (180 degree cone)
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angleToTarget - this.facing);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff > Math.PI / 2) return false;

        // Line of sight check
        return this.hasLineOfSight(targetX, targetY);
    }

    hasLineOfSight(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist * 2);

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = Math.floor(this.x + dx * t);
            const checkY = Math.floor(this.y + dy * t);

            if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                const tile = gameState.map[checkY][checkX];
                if (tile.blocks) return false;
            }
        }
        return true;
    }

    getTUForMove(targetX, targetY) {
        // Simple pathfinding cost
        const dx = Math.abs(targetX - this.x);
        const dy = Math.abs(targetY - this.y);

        if (dx > 1 || dy > 1) return 999; // Can only move to adjacent tiles

        const tile = gameState.map[targetY][targetX];
        if (tile.blocks) return 999;

        return tile.tu;
    }

    move(targetX, targetY) {
        const cost = this.getTUForMove(targetX, targetY);
        if (cost > this.currentTU) return false;

        // Turn to face direction
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        if (dx !== 0 || dy !== 0) {
            this.facing = Math.atan2(dy, dx);
            this.redrawBody();
        }

        this.x = targetX;
        this.y = targetY;
        this.currentTU -= cost;
        this.updateSprite();
        updateFogOfWar();
        return true;
    }

    getShootTU(mode) {
        const costs = {
            snap: Math.floor(this.maxTU * 0.25),
            aimed: Math.floor(this.maxTU * 0.50),
            auto: Math.floor(this.maxTU * 0.35)
        };
        return costs[mode] || costs.snap;
    }

    getAccuracy(mode, targetX, targetY) {
        const modeAcc = { snap: 0.6, aimed: 1.1, auto: 0.35 };
        let acc = this.accuracy * (modeAcc[mode] || 0.6) / 100;

        // Kneeling bonus
        if (this.kneeling) acc *= 1.15;

        // Range penalty
        const dist = Math.sqrt(Math.pow(targetX - this.x, 2) + Math.pow(targetY - this.y, 2));
        acc -= dist * 0.02;

        return Math.max(0.05, Math.min(0.95, acc));
    }

    shoot(targetX, targetY, mode = 'snap') {
        const tuCost = this.getShootTU(mode);
        if (this.currentTU < tuCost) return { success: false, message: 'Not enough TU' };

        // Check ammo
        if (this.ammo <= 0) return { success: false, message: 'No ammo!' };

        this.currentTU -= tuCost;
        this.ammo--;

        // Turn to face target
        this.facing = Math.atan2(targetY - this.y, targetX - this.x);
        this.redrawBody();

        // Calculate hit
        const accuracy = this.getAccuracy(mode, targetX, targetY);
        const shots = mode === 'auto' ? 3 : 1;
        const results = [];

        for (let i = 0; i < shots; i++) {
            const hit = Math.random() < accuracy;
            results.push(hit);

            if (hit) {
                // Check if target has unit
                const target = findUnitAt(targetX, targetY);
                if (target) {
                    const damage = this.calculateDamage();
                    target.takeDamage(damage);
                    results.damage = damage;
                }
            }
        }

        return { success: true, hits: results.filter(h => h).length, total: shots };
    }

    calculateDamage() {
        const baseDamage = {
            rifle: 30, pistol: 26, plasma: 45
        };
        const base = baseDamage[this.weapon] || 30;
        // Damage variance 50% - 200%
        return Math.floor(base * (0.5 + Math.random() * 1.5));
    }

    takeDamage(amount) {
        this.currentHP -= amount;
        if (this.currentHP <= 0) {
            this.currentHP = 0;
            this.alive = false;
            entityContainer.removeChild(this.sprite);
            showMessage(`${this.name} has been killed!`);
        }
        this.updateSprite();
    }

    kneel() {
        if (this.kneeling) {
            if (this.currentTU < TU_STAND) return false;
            this.currentTU -= TU_STAND;
            this.kneeling = false;
        } else {
            if (this.currentTU < TU_KNEEL) return false;
            this.currentTU -= TU_KNEEL;
            this.kneeling = true;
        }
        this.redrawBody();
        return true;
    }

    throwGrenade(targetX, targetY) {
        if (this.grenades <= 0) return false;
        const tuCost = Math.floor(this.maxTU * 0.25);
        if (this.currentTU < tuCost) return false;

        this.grenades--;
        this.currentTU -= tuCost;

        // Grenade explosion
        const damage = 50;
        const radius = 2;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const checkX = targetX + dx;
                const checkY = targetY + dy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const target = findUnitAt(checkX, checkY);
                    if (target) {
                        const dmg = Math.floor(damage * (1 - dist / radius / 2));
                        target.takeDamage(dmg);
                    }
                    // Destroy destructible terrain
                    if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                        const tile = gameState.map[checkY][checkX];
                        if (tile.destructible) {
                            gameState.map[checkY][checkX] = { ...TERRAIN.RUBBLE };
                        }
                    }
                }
            }
        }

        renderMap();
        return true;
    }

    resetTU() {
        this.currentTU = this.maxTU;
    }

    doAITurn() {
        if (!this.alive) return;

        // Find nearest visible enemy
        let nearestEnemy = null;
        let nearestDist = Infinity;

        gameState.soldiers.forEach(soldier => {
            if (!soldier.alive) return;
            const dist = Math.sqrt(Math.pow(soldier.x - this.x, 2) + Math.pow(soldier.y - this.y, 2));
            if (dist < nearestDist && this.hasLineOfSight(soldier.x, soldier.y)) {
                nearestEnemy = soldier;
                nearestDist = dist;
            }
        });

        if (nearestEnemy && nearestDist < 10) {
            // Try to shoot
            if (this.currentTU >= this.getShootTU('snap')) {
                const result = this.shoot(nearestEnemy.x, nearestEnemy.y, 'snap');
                if (result.success && result.hits > 0) {
                    showMessage(`${this.name} hits for ${result.damage || '?'} damage!`);
                }
            }
        } else {
            // Move toward nearest enemy or patrol
            const directions = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
                { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
            ];

            let bestDir = null;
            let bestScore = -Infinity;

            directions.forEach(dir => {
                const newX = this.x + dir.dx;
                const newY = this.y + dir.dy;

                if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;
                if (gameState.map[newY][newX].blocks) return;
                if (findUnitAt(newX, newY)) return;

                let score = 0;
                if (nearestEnemy) {
                    const newDist = Math.sqrt(Math.pow(nearestEnemy.x - newX, 2) + Math.pow(nearestEnemy.y - newY, 2));
                    score = nearestDist - newDist; // Move closer
                } else {
                    score = Math.random(); // Random movement
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestDir = dir;
                }
            });

            if (bestDir && this.currentTU >= TU_WALK) {
                this.move(this.x + bestDir.dx, this.y + bestDir.dy);
            }
        }
    }
}

// Helper functions
function findUnitAt(x, y) {
    for (const soldier of gameState.soldiers) {
        if (soldier.alive && soldier.x === x && soldier.y === y) return soldier;
    }
    for (const alien of gameState.aliens) {
        if (alien.alive && alien.x === x && alien.y === y) return alien;
    }
    return null;
}

function showMessage(text) {
    gameState.message = text;
    gameState.messageTimer = 3;
}

// Generate map
function generateMap() {
    // Initialize with grass
    gameState.map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameState.map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            gameState.map[y][x] = { ...TERRAIN.GRASS };
        }
    }

    // Add crashed UFO in center
    const ufoX = Math.floor(MAP_WIDTH / 2) - 2;
    const ufoY = Math.floor(MAP_HEIGHT / 2) - 2;

    for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
            const x = ufoX + dx;
            const y = ufoY + dy;
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                // UFO walls on edges
                if (dx === 0 || dx === 4 || dy === 0 || dy === 4) {
                    if ((dx === 2 && dy === 0) || (dx === 2 && dy === 4)) {
                        // Doors
                        gameState.map[y][x] = { ...TERRAIN.UFO_FLOOR };
                    } else {
                        gameState.map[y][x] = { ...TERRAIN.UFO_WALL };
                    }
                } else {
                    gameState.map[y][x] = { ...TERRAIN.UFO_FLOOR };
                }
            }
        }
    }

    gameState.ufo = { x: ufoX, y: ufoY, w: 5, h: 5 };

    // Add some scattered forest
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (!gameState.map[y][x].blocks && !(x >= ufoX && x < ufoX + 5 && y >= ufoY && y < ufoY + 5)) {
            gameState.map[y][x] = { ...TERRAIN.FOREST };
        }
    }

    // Add some rubble around UFO (crash debris)
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 2;
        const x = Math.floor(ufoX + 2 + Math.cos(angle) * dist);
        const y = Math.floor(ufoY + 2 + Math.sin(angle) * dist);
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && !gameState.map[y][x].blocks) {
            gameState.map[y][x] = { ...TERRAIN.RUBBLE };
        }
    }

    // Initialize fog of war
    gameState.fogOfWar = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameState.fogOfWar[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            gameState.fogOfWar[y][x] = true; // All hidden initially
        }
    }
}

// Render map
function renderMap() {
    mapContainer.removeChildren();

    const graphics = new PIXI.Graphics();

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = gameState.map[y][x];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            graphics.beginFill(tile.color);
            graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            graphics.endFill();

            // Grid lines
            graphics.lineStyle(1, 0x333333, 0.3);
            graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(0);
        }
    }

    mapContainer.addChild(graphics);
}

// Update fog of war
function updateFogOfWar() {
    gameState.visibleTiles.clear();

    gameState.soldiers.forEach(soldier => {
        if (!soldier.alive) return;

        // Reveal tiles in vision range
        for (let dy = -10; dy <= 10; dy++) {
            for (let dx = -10; dx <= 10; dx++) {
                const x = soldier.x + dx;
                const y = soldier.y + dy;

                if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    if (soldier.canSee(x, y)) {
                        gameState.fogOfWar[y][x] = false;
                        gameState.visibleTiles.add(`${x},${y}`);
                    }
                }
            }
        }
    });

    renderFog();
}

// Render fog
function renderFog() {
    fogContainer.removeChildren();

    const graphics = new PIXI.Graphics();

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            if (gameState.fogOfWar[y][x]) {
                // Fully hidden
                graphics.beginFill(0x000000, 0.9);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.endFill();
            } else if (!gameState.visibleTiles.has(`${x},${y}`)) {
                // Explored but not currently visible
                graphics.beginFill(0x000000, 0.5);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.endFill();
            }
        }
    }

    fogContainer.addChild(graphics);

    // Hide aliens not in visible tiles
    gameState.aliens.forEach(alien => {
        if (alien.alive) {
            alien.sprite.visible = gameState.visibleTiles.has(`${alien.x},${alien.y}`);
        }
    });
}

// Spawn units
function spawnUnits() {
    // Spawn 4 soldiers at bottom of map
    gameState.soldiers = [];
    for (let i = 0; i < 4; i++) {
        const x = 2 + i * 2;
        const y = MAP_HEIGHT - 2;
        const soldier = new Unit(x, y, false, i);
        gameState.soldiers.push(soldier);
    }

    // Spawn aliens inside and around UFO
    gameState.aliens = [];
    const alienTypes = ['sectoid', 'sectoid', 'floater', 'snakeman'];
    const ufoX = gameState.ufo.x + 2;
    const ufoY = gameState.ufo.y + 2;

    alienTypes.forEach((type, i) => {
        let x, y;
        if (i < 2) {
            // Inside UFO
            x = ufoX + (i === 0 ? -1 : 1);
            y = ufoY;
        } else {
            // Around UFO
            const angle = (i - 2) * Math.PI + Math.PI / 4;
            x = Math.floor(ufoX + Math.cos(angle) * 4);
            y = Math.floor(ufoY + Math.sin(angle) * 4);
        }
        // Ensure valid position
        x = Math.max(0, Math.min(MAP_WIDTH - 1, x));
        y = Math.max(0, Math.min(MAP_HEIGHT - 1, y));

        const alien = new Unit(x, y, true, type);
        gameState.aliens.push(alien);
    });
}

// UI elements
let uiElements = {};

function createUI() {
    uiContainer.removeChildren();
    uiElements = {};

    // Unit info panel (left side)
    const infoPanel = new PIXI.Graphics();
    infoPanel.beginFill(0x222233, 0.9);
    infoPanel.drawRect(0, 450, 300, 150);
    infoPanel.endFill();
    uiContainer.addChild(infoPanel);

    uiElements.unitName = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff });
    uiElements.unitName.x = 10;
    uiElements.unitName.y = 460;
    uiContainer.addChild(uiElements.unitName);

    uiElements.unitStats = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 0xaaaaaa });
    uiElements.unitStats.x = 10;
    uiElements.unitStats.y = 480;
    uiContainer.addChild(uiElements.unitStats);

    // Action buttons (right side)
    const buttonPanel = new PIXI.Graphics();
    buttonPanel.beginFill(0x222233, 0.9);
    buttonPanel.drawRect(500, 450, 300, 150);
    buttonPanel.endFill();
    uiContainer.addChild(buttonPanel);

    const buttons = [
        { name: 'Move', mode: 'move', x: 510, y: 460 },
        { name: 'Snap', mode: 'snap', x: 580, y: 460 },
        { name: 'Aimed', mode: 'aimed', x: 650, y: 460 },
        { name: 'Auto', mode: 'auto', x: 720, y: 460 },
        { name: 'Kneel', mode: 'kneel', x: 510, y: 500 },
        { name: 'Grenade', mode: 'grenade', x: 580, y: 500 },
        { name: 'End Turn', mode: 'end', x: 680, y: 500 }
    ];

    uiElements.buttons = [];
    buttons.forEach(btn => {
        const container = new PIXI.Container();
        container.x = btn.x;
        container.y = btn.y;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x444466);
        bg.drawRect(0, 0, 60, 30);
        bg.endFill();
        container.addChild(bg);

        const text = new PIXI.Text(btn.name, { fontFamily: 'monospace', fontSize: 10, fill: 0xffffff });
        text.x = 5;
        text.y = 8;
        container.addChild(text);

        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.on('pointerdown', () => handleButtonClick(btn.mode));

        uiElements.buttons.push({ container, mode: btn.mode, bg });
        uiContainer.addChild(container);
    });

    // Turn indicator
    uiElements.turnText = new PIXI.Text('Turn 1 - Your Turn', { fontFamily: 'monospace', fontSize: 16, fill: 0x44ff44 });
    uiElements.turnText.x = 10;
    uiElements.turnText.y = 10;
    uiContainer.addChild(uiElements.turnText);

    // Message area
    uiElements.messageText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xffff44 });
    uiElements.messageText.x = 400;
    uiElements.messageText.y = 10;
    uiElements.messageText.anchor.set(0.5, 0);
    uiContainer.addChild(uiElements.messageText);

    // Soldier quick select
    uiElements.soldierButtons = [];
    for (let i = 0; i < 4; i++) {
        const btn = new PIXI.Graphics();
        btn.beginFill(0x4488ff);
        btn.drawRect(0, 0, 30, 30);
        btn.endFill();
        btn.x = 320 + i * 40;
        btn.y = 460;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => selectSoldier(i));

        const num = new PIXI.Text(`${i + 1}`, { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff });
        num.x = 10;
        num.y = 8;
        btn.addChild(num);

        uiElements.soldierButtons.push(btn);
        uiContainer.addChild(btn);
    }
}

function updateUI() {
    if (!uiElements.unitName) return;

    const unit = gameState.selectedUnit;
    if (unit) {
        uiElements.unitName.text = unit.name;
        uiElements.unitStats.text =
            `HP: ${unit.currentHP}/${unit.maxHP}  TU: ${unit.currentTU}/${unit.maxTU}\n` +
            `Acc: ${unit.accuracy}  React: ${unit.reactions}\n` +
            `Ammo: ${unit.ammo}  Grenades: ${unit.grenades || 0}\n` +
            `${unit.kneeling ? '[KNEELING]' : ''}`;
    } else {
        uiElements.unitName.text = 'No unit selected';
        uiElements.unitStats.text = 'Click on a soldier to select';
    }

    // Update turn text
    uiElements.turnText.text = `Turn ${gameState.turn} - ${gameState.state === 'player_turn' ? 'Your Turn' : 'Enemy Turn'}`;
    uiElements.turnText.style.fill = gameState.state === 'player_turn' ? 0x44ff44 : 0xff4444;

    // Update message
    uiElements.messageText.text = gameState.message;

    // Highlight selected mode button
    uiElements.buttons.forEach(btn => {
        btn.bg.tint = btn.mode === gameState.actionMode ? 0xffff00 : 0xffffff;
    });

    // Update soldier buttons
    gameState.soldiers.forEach((soldier, i) => {
        if (uiElements.soldierButtons[i]) {
            const btn = uiElements.soldierButtons[i];
            btn.visible = soldier.alive;
            btn.tint = gameState.selectedUnit === soldier ? 0xffff00 : 0xffffff;
        }
    });
}

function handleButtonClick(mode) {
    if (gameState.state !== 'player_turn') return;

    if (mode === 'end') {
        endPlayerTurn();
    } else if (mode === 'kneel' && gameState.selectedUnit) {
        gameState.selectedUnit.kneel();
        updateUI();
    } else if (mode === 'grenade') {
        gameState.actionMode = 'grenade';
    } else if (mode === 'move' || mode === 'snap' || mode === 'aimed' || mode === 'auto') {
        gameState.actionMode = mode;
    }
}

function selectSoldier(index) {
    if (gameState.soldiers[index] && gameState.soldiers[index].alive) {
        gameState.selectedUnit = gameState.soldiers[index];
        updateUI();
    }
}

function endPlayerTurn() {
    gameState.state = 'enemy_turn';
    showMessage('Enemy turn...');

    // Reset enemy TU
    gameState.aliens.forEach(alien => {
        if (alien.alive) alien.resetTU();
    });

    // Process enemy turns with delay
    let alienIndex = 0;
    const processNextAlien = () => {
        while (alienIndex < gameState.aliens.length && !gameState.aliens[alienIndex].alive) {
            alienIndex++;
        }

        if (alienIndex < gameState.aliens.length) {
            const alien = gameState.aliens[alienIndex];
            alien.doAITurn();
            alien.doAITurn(); // Multiple actions
            alienIndex++;
            setTimeout(processNextAlien, 500);
        } else {
            // End enemy turn
            startPlayerTurn();
        }
    };

    setTimeout(processNextAlien, 500);
}

function startPlayerTurn() {
    gameState.turn++;
    gameState.state = 'player_turn';

    // Reset soldier TU
    gameState.soldiers.forEach(soldier => {
        if (soldier.alive) soldier.resetTU();
    });

    // Select first alive soldier
    gameState.selectedUnit = gameState.soldiers.find(s => s.alive) || null;

    showMessage('Your turn!');
    checkVictory();
    updateUI();
}

function checkVictory() {
    const aliensAlive = gameState.aliens.filter(a => a.alive).length;
    const soldiersAlive = gameState.soldiers.filter(s => s.alive).length;

    if (aliensAlive === 0) {
        gameState.state = 'gameover';
        gameState.winner = 'player';
        showMessage('VICTORY! All aliens eliminated!');
    } else if (soldiersAlive === 0) {
        gameState.state = 'gameover';
        gameState.winner = 'aliens';
        showMessage('DEFEAT! All soldiers lost!');
    }
}

// Input handling
app.view.addEventListener('pointerdown', (e) => {
    const rect = app.view.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (gameState.state === 'menu') {
        startGame();
        return;
    }

    if (gameState.state === 'gameover') {
        gameState.state = 'menu';
        return;
    }

    if (gameState.state !== 'player_turn' || mouseY > 440) return;

    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return;

    // Check if clicking on a soldier
    const clickedUnit = findUnitAt(tileX, tileY);
    if (clickedUnit && !clickedUnit.isAlien) {
        gameState.selectedUnit = clickedUnit;
        updateUI();
        return;
    }

    // Handle actions
    if (!gameState.selectedUnit) return;

    if (gameState.actionMode === 'move') {
        // Move to adjacent tile
        const dx = Math.abs(tileX - gameState.selectedUnit.x);
        const dy = Math.abs(tileY - gameState.selectedUnit.y);
        if (dx <= 1 && dy <= 1 && (dx + dy > 0)) {
            if (gameState.selectedUnit.move(tileX, tileY)) {
                showMessage(`Moved. TU: ${gameState.selectedUnit.currentTU}`);
            }
        }
    } else if (['snap', 'aimed', 'auto'].includes(gameState.actionMode)) {
        // Shoot
        if (gameState.visibleTiles.has(`${tileX},${tileY}`)) {
            const result = gameState.selectedUnit.shoot(tileX, tileY, gameState.actionMode);
            if (result.success) {
                showMessage(`${result.hits}/${result.total} hits!`);
                checkVictory();
            } else {
                showMessage(result.message);
            }
        } else {
            showMessage("Can't see target!");
        }
    } else if (gameState.actionMode === 'grenade') {
        // Throw grenade
        const dist = Math.sqrt(Math.pow(tileX - gameState.selectedUnit.x, 2) + Math.pow(tileY - gameState.selectedUnit.y, 2));
        if (dist <= 10) {
            if (gameState.selectedUnit.throwGrenade(tileX, tileY)) {
                showMessage('Grenade thrown!');
                checkVictory();
            } else {
                showMessage('No grenades or TU!');
            }
        }
    }

    updateUI();
});

// Keyboard input
window.addEventListener('keydown', (e) => {
    if (gameState.state !== 'player_turn') return;

    const key = e.key;

    // Number keys to select soldiers
    if (key >= '1' && key <= '4') {
        selectSoldier(parseInt(key) - 1);
    }

    // Action mode shortcuts
    if (key === 'm') gameState.actionMode = 'move';
    if (key === 's') gameState.actionMode = 'snap';
    if (key === 'a') gameState.actionMode = 'aimed';
    if (key === 'f') gameState.actionMode = 'auto';
    if (key === 'g') gameState.actionMode = 'grenade';
    if (key === 'k' && gameState.selectedUnit) {
        gameState.selectedUnit.kneel();
        updateUI();
    }
    if (key === 'Enter' || key === 'e') endPlayerTurn();

    updateUI();
});

// Start game
function startGame() {
    gameState.state = 'player_turn';
    gameState.turn = 1;
    gameState.winner = null;
    gameState.message = '';
    gameState.actionMode = 'move';

    entityContainer.removeChildren();
    generateMap();
    renderMap();
    spawnUnits();
    createUI();

    gameState.selectedUnit = gameState.soldiers[0];
    updateFogOfWar();
    updateUI();

    showMessage('UFO Crash Recovery Mission - Eliminate all aliens!');
}

// Menu screen
function renderMenu() {
    uiContainer.removeChildren();
    mapContainer.removeChildren();
    entityContainer.removeChildren();
    fogContainer.removeChildren();

    const title = new PIXI.Text('X-COM CLASSIC', {
        fontFamily: 'monospace', fontSize: 36, fill: 0x44ff44
    });
    title.x = 400;
    title.y = 150;
    title.anchor.set(0.5);
    uiContainer.addChild(title);

    const subtitle = new PIXI.Text('UFO: Enemy Unknown Clone', {
        fontFamily: 'monospace', fontSize: 16, fill: 0xaaaaaa
    });
    subtitle.x = 400;
    subtitle.y = 200;
    subtitle.anchor.set(0.5);
    uiContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'CONTROLS:\n\n' +
        '1-4: Select soldier\n' +
        'M: Move mode   S: Snap shot   A: Aimed shot\n' +
        'F: Auto fire   G: Grenade   K: Kneel/Stand\n' +
        'Enter: End Turn\n\n' +
        'Click tile to move/attack\n' +
        'Kill all aliens to win!',
        { fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc, align: 'center' }
    );
    controls.x = 400;
    controls.y = 320;
    controls.anchor.set(0.5);
    uiContainer.addChild(controls);

    const start = new PIXI.Text('Click to Start Mission', {
        fontFamily: 'monospace', fontSize: 18, fill: 0xffff44
    });
    start.x = 400;
    start.y = 500;
    start.anchor.set(0.5);
    uiContainer.addChild(start);
}

// Game over screen
function renderGameOver() {
    uiContainer.removeChildren();

    const text = new PIXI.Text(
        gameState.winner === 'player' ? 'MISSION COMPLETE' : 'MISSION FAILED',
        { fontFamily: 'monospace', fontSize: 36, fill: gameState.winner === 'player' ? 0x44ff44 : 0xff4444 }
    );
    text.x = 400;
    text.y = 200;
    text.anchor.set(0.5);
    uiContainer.addChild(text);

    const survivors = gameState.soldiers.filter(s => s.alive).length;
    const stats = new PIXI.Text(
        `Soldiers survived: ${survivors}/4\n` +
        `Aliens eliminated: ${gameState.aliens.filter(a => !a.alive).length}/${gameState.aliens.length}\n` +
        `Turns: ${gameState.turn}`,
        { fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc, align: 'center' }
    );
    stats.x = 400;
    stats.y = 300;
    stats.anchor.set(0.5);
    uiContainer.addChild(stats);

    const restart = new PIXI.Text('Click to Return to Menu', {
        fontFamily: 'monospace', fontSize: 16, fill: 0xffffff
    });
    restart.x = 400;
    restart.y = 450;
    restart.anchor.set(0.5);
    uiContainer.addChild(restart);
}

// Main loop
app.ticker.add((delta) => {
    const dt = delta / 60;

    // Update message timer
    if (gameState.messageTimer > 0) {
        gameState.messageTimer -= dt;
        if (gameState.messageTimer <= 0) {
            gameState.message = '';
            if (uiElements.messageText) {
                uiElements.messageText.text = '';
            }
        }
    }

    // Update sprites
    gameState.soldiers.forEach(s => {
        if (s.alive) s.updateSprite();
    });
    gameState.aliens.forEach(a => {
        if (a.alive) a.updateSprite();
    });

    // Render appropriate screen
    if (gameState.state === 'menu') {
        // Menu is static
    } else if (gameState.state === 'gameover') {
        if (!gameState.gameOverRendered) {
            renderGameOver();
            gameState.gameOverRendered = true;
        }
    } else {
        gameState.gameOverRendered = false;
    }
});

// Initial menu
renderMenu();
