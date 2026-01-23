// X-COM Tactical Clone - Phaser 3 Implementation

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const MAP_OFFSET_X = 160;
const MAP_OFFSET_Y = 40;

// Colors
const COLORS = {
    bg: 0x0a0a1a,
    grass: 0x2a4a2a,
    grassDark: 0x1a3a1a,
    dirt: 0x4a3a2a,
    wall: 0x3a3a4a,
    floor: 0x4a4a5a,
    road: 0x3a3a3a,
    ufo: 0x3a4a5a,
    soldier: 0x4488cc,
    soldierSelected: 0x66aaff,
    alien: 0xcc4444,
    ui: 0x1a1a2a,
    uiBorder: 0x445566,
    tu: 0x44aa44,
    health: 0xcc4444,
    text: 0xcccccc
};

// Alien definitions
const ALIEN_TYPES = {
    sectoid: { name: 'Sectoid', hp: 30, tu: 54, reactions: 63, armor: 4, damage: 25, acc: 50, color: 0x88aa88 },
    floater: { name: 'Floater', hp: 40, tu: 60, reactions: 50, armor: 8, damage: 30, acc: 45, color: 0xaa8888 },
    snakeman: { name: 'Snakeman', hp: 50, tu: 70, reactions: 55, armor: 12, damage: 35, acc: 55, color: 0x88aa44 }
};

// Game data
const GameData = {
    map: [],
    visibilityMap: [],
    soldiers: [],
    aliens: [],
    selectedUnit: null,
    actionMode: 'move',
    turn: 'player',
    turnNumber: 1,
    messages: [],
    showDebug: false
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    create() { this.scene.start('MenuScene'); }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        this.add.text(400, 120, 'X-COM TACTICAL', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 160, 'UFO Crash Recovery Mission', {
            fontSize: '18px', fontFamily: 'Courier New', color: '#888899'
        }).setOrigin(0.5);

        this.add.text(400, 240, 'Press SPACE or Click to Start', {
            fontSize: '16px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setOrigin(0.5);

        this.add.text(400, 320, 'Controls:', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#667788'
        }).setOrigin(0.5);

        const controls = [
            'Click - Select/Move/Attack',
            '1-4 - Select Action Mode',
            'Tab - Next Soldier | K - Kneel',
            'Enter - End Turn | Q - Debug'
        ];

        controls.forEach((text, i) => {
            this.add.text(400, 345 + i * 20, text, {
                fontSize: '12px', fontFamily: 'Courier New', color: '#667788'
            }).setOrigin(0.5);
        });

        this.add.text(400, 450, 'Objective: Eliminate all aliens', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
        this.input.on('pointerdown', () => this.startGame());
    }

    startGame() {
        resetGameData();
        this.scene.start('GameScene');
    }
}

function resetGameData() {
    GameData.turn = 'player';
    GameData.turnNumber = 1;
    GameData.messages = [];
    GameData.showDebug = false;
    GameData.actionMode = 'move';
    GameData.selectedUnit = null;
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        this.generateMap();
        this.spawnUnits();

        // Graphics layers
        this.mapGraphics = this.add.graphics();
        this.unitGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        // Text elements
        this.createUITexts();

        this.setupInput();
        this.updateVisibility();
        this.addMessage('Mission Start: Eliminate all aliens');
    }

    createUITexts() {
        // Squad title
        this.add.text(8, 10, 'SQUAD', { fontSize: '14px', fontFamily: 'Courier New', color: '#aabbcc' });

        // Turn indicator
        this.turnText = this.add.text(MAP_OFFSET_X + 320, 15, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        // Soldier list in left panel
        this.soldierTexts = [];
        for (let i = 0; i < 4; i++) {
            this.soldierTexts.push({
                name: this.add.text(8, 45 + i * 70, '', { fontSize: '12px', fontFamily: 'Courier New', color: '#aabbcc' }),
                stats: this.add.text(8, 60 + i * 70, '', { fontSize: '10px', fontFamily: 'Courier New', color: '#888899' }),
                tuLabel: this.add.text(8, 75 + i * 70, '', { fontSize: '10px', fontFamily: 'Courier New', color: '#667788' }),
                hpLabel: this.add.text(8, 88 + i * 70, '', { fontSize: '10px', fontFamily: 'Courier New', color: '#667788' })
            });
        }

        // Action buttons text in bottom panel
        this.actionTexts = {
            mode: this.add.text(MAP_OFFSET_X + 10, 530, '', { fontSize: '14px', fontFamily: 'Courier New', color: '#cccccc' }),
            buttons: this.add.text(MAP_OFFSET_X + 10, 550, '[1]Move [2]Snap [3]Aimed [4]Grenade', { fontSize: '11px', fontFamily: 'Courier New', color: '#888899' }),
            controls: this.add.text(MAP_OFFSET_X + 10, 570, '[K]Kneel [Tab]Next [Enter]End Turn [Q]Debug', { fontSize: '11px', fontFamily: 'Courier New', color: '#667788' }),
            ammo: this.add.text(MAP_OFFSET_X + 400, 530, '', { fontSize: '12px', fontFamily: 'Courier New', color: '#aabbcc' }),
            grenades: this.add.text(MAP_OFFSET_X + 400, 550, '', { fontSize: '12px', fontFamily: 'Courier New', color: '#aabbcc' })
        };

        // Message log
        this.messageTexts = [];
        for (let i = 0; i < 6; i++) {
            this.messageTexts.push(
                this.add.text(MAP_OFFSET_X + 550, 530 + i * 12, '', { fontSize: '10px', fontFamily: 'Courier New', color: '#aabbcc' })
            );
        }

        // Debug overlay texts
        this.debugTexts = [];
        for (let i = 0; i < 10; i++) {
            this.debugTexts.push(
                this.add.text(MAP_OFFSET_X + 10, MAP_OFFSET_Y + 10 + i * 14, '', { fontSize: '11px', fontFamily: 'Courier New', color: '#00ff00' })
            );
        }
    }

    generateMap() {
        GameData.map = [];
        GameData.visibilityMap = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            GameData.map[y] = [];
            GameData.visibilityMap[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                let tile = { type: 'grass', walkable: true, cover: 0 };

                // UFO crash site
                if (x >= 12 && x <= 17 && y >= 5 && y <= 10) {
                    if (x === 12 || x === 17 || y === 5 || y === 10) {
                        tile = { type: 'ufo_wall', walkable: false, cover: 100 };
                    } else {
                        tile = { type: 'ufo_floor', walkable: true, cover: 0 };
                    }
                }
                // Road
                else if ((x >= 8 && x <= 10 && y >= 0 && y <= 4) || (y === 4 && x >= 5 && x <= 10)) {
                    tile = { type: 'road', walkable: true, cover: 0 };
                }
                // Building
                else if (x >= 1 && x <= 4 && y >= 8 && y <= 12) {
                    if (x === 1 || x === 4 || y === 8 || y === 12) {
                        tile = { type: 'wall', walkable: false, cover: 100 };
                    } else {
                        tile = { type: 'floor', walkable: true, cover: 0 };
                    }
                }
                // Random bushes
                else if (Math.random() < 0.08) {
                    tile = { type: 'bush', walkable: true, cover: 40 };
                }
                // Dirt patches
                else if (Math.random() < 0.15) {
                    tile = { type: 'dirt', walkable: true, cover: 0 };
                }

                GameData.map[y][x] = tile;
                GameData.visibilityMap[y][x] = 0;
            }
        }
    }

    spawnUnits() {
        GameData.soldiers = [];
        GameData.aliens = [];

        const soldierNames = ['John Smith', 'Maria Garcia', 'Hans Mueller', 'Yuki Tanaka'];
        const startPositions = [[1, 1], [2, 1], [1, 3], [2, 3]];

        for (let i = 0; i < 4; i++) {
            GameData.soldiers.push({
                id: i,
                name: soldierNames[i],
                x: startPositions[i][0],
                y: startPositions[i][1],
                hp: 40 + Math.floor(Math.random() * 20),
                maxHp: 40 + Math.floor(Math.random() * 20),
                tu: 55 + Math.floor(Math.random() * 15),
                maxTu: 55 + Math.floor(Math.random() * 15),
                reactions: 40 + Math.floor(Math.random() * 30),
                firingAcc: 50 + Math.floor(Math.random() * 30),
                kneeling: false,
                facing: 2,
                weapon: { name: 'Rifle', damage: 30, currentAmmo: 20, maxAmmo: 20,
                    snap: { tu: 25, acc: 60 }, aimed: { tu: 80, acc: 110 } },
                grenades: 2,
                alive: true
            });
        }

        const alienPositions = [[14, 7], [15, 8], [13, 9], [16, 7], [15, 6]];
        const alienTypes = ['sectoid', 'sectoid', 'floater', 'sectoid', 'snakeman'];

        for (let i = 0; i < alienPositions.length; i++) {
            const type = ALIEN_TYPES[alienTypes[i]];
            GameData.aliens.push({
                id: i,
                type: alienTypes[i],
                name: type.name,
                x: alienPositions[i][0],
                y: alienPositions[i][1],
                hp: type.hp,
                maxHp: type.hp,
                tu: type.tu,
                maxTu: type.tu,
                reactions: type.reactions,
                armor: type.armor,
                damage: type.damage,
                acc: type.acc,
                color: type.color,
                facing: 6,
                alive: true,
                spotted: false
            });
        }

        GameData.selectedUnit = GameData.soldiers[0];
    }

    setupInput() {
        this.input.on('pointerdown', (pointer) => this.handleClick(pointer));

        this.input.keyboard.on('keydown-Q', () => {
            GameData.showDebug = !GameData.showDebug;
        });

        this.input.keyboard.on('keydown-ONE', () => { GameData.actionMode = 'move'; });
        this.input.keyboard.on('keydown-TWO', () => { GameData.actionMode = 'snap'; });
        this.input.keyboard.on('keydown-THREE', () => { GameData.actionMode = 'aimed'; });
        this.input.keyboard.on('keydown-FOUR', () => { GameData.actionMode = 'grenade'; });

        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.selectNextSoldier();
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (GameData.turn === 'player') this.endPlayerTurn();
        });

        this.input.keyboard.on('keydown-K', () => {
            if (GameData.selectedUnit) this.toggleKneel(GameData.selectedUnit);
        });
    }

    handleClick(pointer) {
        if (GameData.turn !== 'player') return;

        const mx = pointer.x;
        const my = pointer.y;

        const tileX = Math.floor((mx - MAP_OFFSET_X) / TILE_SIZE);
        const tileY = Math.floor((my - MAP_OFFSET_Y) / TILE_SIZE);

        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            // Select soldier
            const clickedSoldier = GameData.soldiers.find(s => s.alive && s.x === tileX && s.y === tileY);
            if (clickedSoldier) {
                GameData.selectedUnit = clickedSoldier;
                GameData.actionMode = 'move';
                return;
            }

            // Attack alien
            const clickedAlien = GameData.aliens.find(a => a.alive && a.spotted && a.x === tileX && a.y === tileY);

            if (GameData.selectedUnit && GameData.selectedUnit.alive) {
                if (GameData.actionMode === 'move' && !clickedAlien) {
                    this.moveUnit(GameData.selectedUnit, tileX, tileY);
                } else if ((GameData.actionMode === 'snap' || GameData.actionMode === 'aimed') && clickedAlien) {
                    this.fireWeapon(GameData.selectedUnit, clickedAlien, GameData.actionMode);
                } else if (GameData.actionMode === 'grenade' && GameData.selectedUnit.grenades > 0) {
                    this.throwGrenade(GameData.selectedUnit, tileX, tileY);
                }
            }
        }

        // Check soldier list clicks
        for (let i = 0; i < GameData.soldiers.length; i++) {
            const sy = 45 + i * 70;
            if (mx >= 5 && mx <= 150 && my >= sy && my <= sy + 60 && GameData.soldiers[i].alive) {
                GameData.selectedUnit = GameData.soldiers[i];
                GameData.actionMode = 'move';
            }
        }
    }

    moveUnit(unit, targetX, targetY) {
        if (!GameData.map[targetY] || !GameData.map[targetY][targetX] || !GameData.map[targetY][targetX].walkable) return;
        if (GameData.soldiers.some(s => s.alive && s.x === targetX && s.y === targetY)) return;
        if (GameData.aliens.some(a => a.alive && a.x === targetX && a.y === targetY)) return;

        const distance = Math.abs(targetX - unit.x) + Math.abs(targetY - unit.y);
        const tuCost = distance * 4;

        if (unit.tu < tuCost) {
            this.addMessage('Not enough TU!');
            return;
        }

        unit.tu -= tuCost;
        unit.x = targetX;
        unit.y = targetY;
        this.updateVisibility();
        this.checkReactionFire(unit);
    }

    fireWeapon(unit, target, mode) {
        const weapon = unit.weapon;
        const shotData = mode === 'snap' ? weapon.snap : weapon.aimed;

        const tuCost = Math.floor(unit.maxTu * shotData.tu / 100);
        if (unit.tu < tuCost) {
            this.addMessage('Not enough TU!');
            return;
        }

        if (weapon.currentAmmo <= 0) {
            this.addMessage('Out of ammo!');
            return;
        }

        unit.tu -= tuCost;
        weapon.currentAmmo--;

        let hitChance = (unit.firingAcc * shotData.acc / 100);
        if (unit.kneeling) hitChance *= 1.15;
        const distance = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
        hitChance -= distance * 2;
        hitChance = Math.max(5, Math.min(95, hitChance));

        const roll = Math.random() * 100;
        if (roll < hitChance) {
            const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
            const finalDamage = Math.max(1, damage - target.armor);
            target.hp -= finalDamage;

            this.addMessage(`${unit.name} hits ${target.name} for ${finalDamage}!`);

            if (target.hp <= 0) {
                target.alive = false;
                this.addMessage(`${target.name} eliminated!`);
                this.checkVictory();
            }
        } else {
            this.addMessage(`${unit.name} misses!`);
        }
    }

    throwGrenade(unit, targetX, targetY) {
        const distance = Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY);
        if (distance > 8) {
            this.addMessage('Target too far!');
            return;
        }

        const tuCost = Math.floor(unit.maxTu * 0.25) + 4;
        if (unit.tu < tuCost) {
            this.addMessage('Not enough TU!');
            return;
        }

        unit.tu -= tuCost;
        unit.grenades--;

        const radius = 2;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist > radius) continue;

                const damage = Math.floor(50 * (1 - dist / (radius + 1)));

                for (const alien of GameData.aliens) {
                    if (alien.alive && alien.x === tx && alien.y === ty) {
                        const finalDamage = Math.max(1, damage - alien.armor);
                        alien.hp -= finalDamage;
                        this.addMessage(`Grenade hits ${alien.name} for ${finalDamage}!`);
                        if (alien.hp <= 0) {
                            alien.alive = false;
                            this.addMessage(`${alien.name} eliminated!`);
                        }
                    }
                }

                for (const soldier of GameData.soldiers) {
                    if (soldier.alive && soldier.x === tx && soldier.y === ty) {
                        soldier.hp -= damage;
                        this.addMessage(`Grenade hits ${soldier.name} for ${damage}!`);
                        if (soldier.hp <= 0) {
                            soldier.alive = false;
                            this.addMessage(`${soldier.name} KIA!`);
                        }
                    }
                }
            }
        }

        this.checkVictory();
        this.checkDefeat();
    }

    toggleKneel(unit) {
        const cost = unit.kneeling ? 8 : 4;
        if (unit.tu < cost) {
            this.addMessage('Not enough TU!');
            return;
        }
        unit.tu -= cost;
        unit.kneeling = !unit.kneeling;
        this.addMessage(unit.kneeling ? `${unit.name} kneels` : `${unit.name} stands`);
    }

    selectNextSoldier() {
        if (!GameData.selectedUnit) {
            GameData.selectedUnit = GameData.soldiers.find(s => s.alive);
            return;
        }

        const currentIndex = GameData.soldiers.findIndex(s => s === GameData.selectedUnit);
        for (let i = 1; i <= GameData.soldiers.length; i++) {
            const nextIndex = (currentIndex + i) % GameData.soldiers.length;
            if (GameData.soldiers[nextIndex].alive && GameData.soldiers[nextIndex].tu > 0) {
                GameData.selectedUnit = GameData.soldiers[nextIndex];
                return;
            }
        }
    }

    checkReactionFire(movingUnit) {
        for (const alien of GameData.aliens) {
            if (!alien.alive || alien.tu < 20) continue;
            if (!this.hasLineOfSight(alien.x, alien.y, movingUnit.x, movingUnit.y)) continue;

            const alienReaction = alien.reactions * alien.tu;
            const unitReaction = movingUnit.reactions * movingUnit.tu;

            if (alienReaction > unitReaction * 0.5) {
                const hitChance = Math.max(10, alien.acc - 20);
                const roll = Math.random() * 100;

                if (roll < hitChance) {
                    const damage = Math.floor(alien.damage * (0.5 + Math.random() * 1.0));
                    movingUnit.hp -= damage;
                    this.addMessage(`Reaction fire! ${alien.name} hits ${movingUnit.name} for ${damage}!`);

                    if (movingUnit.hp <= 0) {
                        movingUnit.alive = false;
                        this.addMessage(`${movingUnit.name} KIA!`);
                        this.checkDefeat();
                    }
                } else {
                    this.addMessage(`Reaction fire! ${alien.name} misses!`);
                }

                alien.tu -= 20;
                break;
            }
        }
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let cx = x1, cy = y1;
        while (cx !== x2 || cy !== y2) {
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }

            if (cx === x2 && cy === y2) break;
            if (GameData.map[cy] && GameData.map[cy][cx] && !GameData.map[cy][cx].walkable) return false;
        }
        return true;
    }

    updateVisibility() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                GameData.visibilityMap[y][x] = 0;
            }
        }

        for (const soldier of GameData.soldiers) {
            if (!soldier.alive) continue;

            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const distance = Math.abs(x - soldier.x) + Math.abs(y - soldier.y);
                    if (distance <= 12 && this.hasLineOfSight(soldier.x, soldier.y, x, y)) {
                        GameData.visibilityMap[y][x] = 2;
                    } else if (distance <= 15) {
                        GameData.visibilityMap[y][x] = Math.max(GameData.visibilityMap[y][x], 1);
                    }
                }
            }
        }

        for (const alien of GameData.aliens) {
            alien.spotted = GameData.visibilityMap[alien.y][alien.x] === 2;
        }
    }

    endPlayerTurn() {
        GameData.turn = 'enemy';
        this.addMessage('--- Enemy Turn ---');

        for (const soldier of GameData.soldiers) {
            if (soldier.alive) soldier.tu = soldier.maxTu;
        }

        this.time.delayedCall(500, () => this.enemyTurn());
    }

    enemyTurn() {
        for (const alien of GameData.aliens) {
            if (!alien.alive) continue;

            alien.tu = alien.maxTu;

            let nearestSoldier = null;
            let nearestDist = Infinity;

            for (const soldier of GameData.soldiers) {
                if (!soldier.alive) continue;
                if (!this.hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) continue;

                const dist = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestSoldier = soldier;
                }
            }

            if (nearestSoldier) {
                if (nearestDist <= 10 && alien.tu >= 25) {
                    const hitChance = Math.max(10, alien.acc - nearestDist * 2);
                    const roll = Math.random() * 100;

                    if (roll < hitChance) {
                        const damage = Math.floor(alien.damage * (0.5 + Math.random() * 1.0));
                        nearestSoldier.hp -= damage;
                        this.addMessage(`${alien.name} hits ${nearestSoldier.name} for ${damage}!`);

                        if (nearestSoldier.hp <= 0) {
                            nearestSoldier.alive = false;
                            this.addMessage(`${nearestSoldier.name} KIA!`);
                        }
                    } else {
                        this.addMessage(`${alien.name} misses!`);
                    }

                    alien.tu -= 25;
                } else {
                    const dx = nearestSoldier.x - alien.x;
                    const dy = nearestSoldier.y - alien.y;
                    let moveX = alien.x + Math.sign(dx);
                    let moveY = alien.y + Math.sign(dy);

                    if (Math.abs(dx) > Math.abs(dy)) {
                        moveY = alien.y;
                    } else {
                        moveX = alien.x;
                    }

                    if (GameData.map[moveY] && GameData.map[moveY][moveX] && GameData.map[moveY][moveX].walkable &&
                        !GameData.soldiers.some(s => s.alive && s.x === moveX && s.y === moveY) &&
                        !GameData.aliens.some(a => a.alive && a !== alien && a.x === moveX && a.y === moveY)) {

                        alien.x = moveX;
                        alien.y = moveY;
                        alien.tu -= 4;
                    }
                }
            }
        }

        this.checkDefeat();

        this.time.delayedCall(1000, () => {
            GameData.turn = 'player';
            GameData.turnNumber++;
            this.addMessage(`--- Turn ${GameData.turnNumber} ---`);
            this.updateVisibility();
        });
    }

    checkVictory() {
        if (GameData.aliens.every(a => !a.alive)) {
            this.scene.start('VictoryScene');
        }
    }

    checkDefeat() {
        if (GameData.soldiers.every(s => !s.alive)) {
            this.scene.start('DefeatScene');
        }
    }

    addMessage(text) {
        GameData.messages.push({ text, time: 300 });
        if (GameData.messages.length > 6) GameData.messages.shift();
    }

    update() {
        GameData.messages = GameData.messages.filter(m => {
            m.time--;
            return m.time > 0;
        });

        this.render();
    }

    render() {
        this.mapGraphics.clear();
        this.unitGraphics.clear();
        this.uiGraphics.clear();

        this.renderMap();
        this.renderUnits();
        this.renderUI();
        if (GameData.showDebug) this.renderDebug();
    }

    renderMap() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = GameData.map[y][x];
                const screenX = MAP_OFFSET_X + x * TILE_SIZE;
                const screenY = MAP_OFFSET_Y + y * TILE_SIZE;

                let color = COLORS.grass;
                switch (tile.type) {
                    case 'grass': color = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassDark; break;
                    case 'dirt': color = COLORS.dirt; break;
                    case 'road': color = COLORS.road; break;
                    case 'wall': color = COLORS.wall; break;
                    case 'floor': color = COLORS.floor; break;
                    case 'bush': color = 0x3a5a3a; break;
                    case 'ufo_wall': color = 0x2a3a4a; break;
                    case 'ufo_floor': color = 0x3a4a5a; break;
                }

                this.mapGraphics.fillStyle(color);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                if (tile.type === 'bush') {
                    this.mapGraphics.fillStyle(0x4a6a4a);
                    this.mapGraphics.fillCircle(screenX + 16, screenY + 16, 10);
                }

                this.mapGraphics.lineStyle(1, 0x323a42, 0.5);
                this.mapGraphics.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Fog of war
                if (GameData.visibilityMap[y][x] === 0) {
                    this.mapGraphics.fillStyle(COLORS.bg);
                    this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                } else if (GameData.visibilityMap[y][x] === 1) {
                    this.mapGraphics.fillStyle(COLORS.bg, 0.7);
                    this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Highlight move range
        if (GameData.selectedUnit && GameData.turn === 'player' && GameData.actionMode === 'move') {
            const maxRange = Math.floor(GameData.selectedUnit.tu / 4);
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const dist = Math.abs(x - GameData.selectedUnit.x) + Math.abs(y - GameData.selectedUnit.y);
                    if (dist <= maxRange && GameData.map[y][x].walkable && GameData.visibilityMap[y][x] > 0) {
                        this.mapGraphics.fillStyle(0x4488cc, 0.3);
                        this.mapGraphics.fillRect(MAP_OFFSET_X + x * TILE_SIZE, MAP_OFFSET_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    }

    renderUnits() {
        // Soldiers
        for (const soldier of GameData.soldiers) {
            if (!soldier.alive) continue;

            const screenX = MAP_OFFSET_X + soldier.x * TILE_SIZE;
            const screenY = MAP_OFFSET_Y + soldier.y * TILE_SIZE;

            if (soldier === GameData.selectedUnit) {
                this.unitGraphics.lineStyle(2, 0xffff44);
                this.unitGraphics.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }

            this.unitGraphics.fillStyle(soldier === GameData.selectedUnit ? COLORS.soldierSelected : COLORS.soldier);
            if (soldier.kneeling) {
                this.unitGraphics.fillRect(screenX + 6, screenY + 12, 20, 16);
            } else {
                this.unitGraphics.fillRect(screenX + 8, screenY + 4, 16, 24);
            }

            this.unitGraphics.fillStyle(0xddccaa);
            this.unitGraphics.fillCircle(screenX + 16, screenY + 8, 5);
        }

        // Aliens
        for (const alien of GameData.aliens) {
            if (!alien.alive || !alien.spotted) continue;

            const screenX = MAP_OFFSET_X + alien.x * TILE_SIZE;
            const screenY = MAP_OFFSET_Y + alien.y * TILE_SIZE;

            this.unitGraphics.fillStyle(alien.color);
            this.unitGraphics.fillCircle(screenX + 16, screenY + 16, 12);

            // HP bar
            const hpPercent = alien.hp / alien.maxHp;
            this.unitGraphics.fillStyle(0x222222);
            this.unitGraphics.fillRect(screenX, screenY - 4, TILE_SIZE, 3);
            this.unitGraphics.fillStyle(hpPercent > 0.5 ? 0x44aa44 : (hpPercent > 0.25 ? 0xaaaa44 : 0xaa4444));
            this.unitGraphics.fillRect(screenX, screenY - 4, TILE_SIZE * hpPercent, 3);
        }
    }

    renderUI() {
        // Left panel
        this.uiGraphics.fillStyle(COLORS.ui);
        this.uiGraphics.fillRect(0, 0, 155, 600);
        this.uiGraphics.lineStyle(1, COLORS.uiBorder);
        this.uiGraphics.strokeRect(0, 0, 155, 600);

        // Soldier list
        for (let i = 0; i < GameData.soldiers.length; i++) {
            const soldier = GameData.soldiers[i];
            const st = this.soldierTexts[i];
            const y = 45 + i * 70;

            // Background highlight for selected
            if (soldier === GameData.selectedUnit) {
                this.uiGraphics.fillStyle(0x223344);
                this.uiGraphics.fillRect(2, y - 4, 150, 65);
            }

            if (soldier.alive) {
                st.name.setText(soldier.name);
                st.name.setColor(soldier === GameData.selectedUnit ? '#66aaff' : '#aabbcc');
                st.stats.setText(`Acc:${soldier.firingAcc} React:${soldier.reactions}`);
                st.tuLabel.setText(`TU: ${soldier.tu}/${soldier.maxTu}`);
                st.hpLabel.setText(`HP: ${soldier.hp}/${soldier.maxHp}`);

                // HP bar
                const hpPct = soldier.hp / soldier.maxHp;
                this.uiGraphics.fillStyle(0x222222);
                this.uiGraphics.fillRect(60, y + 42, 80, 6);
                this.uiGraphics.fillStyle(hpPct > 0.5 ? 0x44aa44 : (hpPct > 0.25 ? 0xaaaa44 : 0xaa4444));
                this.uiGraphics.fillRect(60, y + 42, 80 * hpPct, 6);

                // TU bar
                const tuPct = soldier.tu / soldier.maxTu;
                this.uiGraphics.fillStyle(0x222222);
                this.uiGraphics.fillRect(60, y + 30, 80, 6);
                this.uiGraphics.fillStyle(0x4488cc);
                this.uiGraphics.fillRect(60, y + 30, 80 * tuPct, 6);
            } else {
                st.name.setText(soldier.name);
                st.name.setColor('#aa4444');
                st.stats.setText('KIA');
                st.tuLabel.setText('');
                st.hpLabel.setText('');
            }
        }

        // Bottom panel
        this.uiGraphics.fillStyle(COLORS.ui);
        this.uiGraphics.fillRect(MAP_OFFSET_X, 520, 640, 80);
        this.uiGraphics.lineStyle(1, COLORS.uiBorder);
        this.uiGraphics.strokeRect(MAP_OFFSET_X, 520, 640, 80);

        // Turn indicator
        const turnColor = GameData.turn === 'player' ? '#44ff44' : '#ff4444';
        this.turnText.setText(`Turn ${GameData.turnNumber} - ${GameData.turn.toUpperCase()}`);
        this.turnText.setColor(turnColor);

        // Action mode display
        if (GameData.selectedUnit && GameData.selectedUnit.alive) {
            const modeNames = { move: 'MOVE', snap: 'SNAP SHOT', aimed: 'AIMED SHOT', grenade: 'GRENADE' };
            this.actionTexts.mode.setText(`Mode: ${modeNames[GameData.actionMode]}`);
            this.actionTexts.ammo.setText(`Ammo: ${GameData.selectedUnit.weapon.currentAmmo}/${GameData.selectedUnit.weapon.maxAmmo}`);
            this.actionTexts.grenades.setText(`Grenades: ${GameData.selectedUnit.grenades}`);
        }

        // Messages
        for (let i = 0; i < this.messageTexts.length; i++) {
            if (i < GameData.messages.length) {
                const alpha = Math.min(1, GameData.messages[i].time / 100);
                this.messageTexts[i].setText(GameData.messages[i].text);
                this.messageTexts[i].setAlpha(alpha);
            } else {
                this.messageTexts[i].setText('');
            }
        }
    }

    renderDebug() {
        // Hide debug texts if not showing
        for (const dt of this.debugTexts) {
            dt.setVisible(GameData.showDebug);
        }

        if (!GameData.showDebug) return;

        this.uiGraphics.fillStyle(0x000000, 0.9);
        this.uiGraphics.fillRect(MAP_OFFSET_X + 5, MAP_OFFSET_Y + 5, 200, 160);

        const unit = GameData.selectedUnit;
        const aliensAlive = GameData.aliens.filter(a => a.alive).length;
        const soldiersAlive = GameData.soldiers.filter(s => s.alive).length;

        const debugLines = [
            'DEBUG OVERLAY',
            unit ? `Selected: ${unit.name}` : 'No selection',
            unit ? `Position: ${unit.x}, ${unit.y}` : '',
            unit ? `HP: ${unit.hp}/${unit.maxHp} TU: ${unit.tu}/${unit.maxTu}` : '',
            unit ? `Accuracy: ${unit.firingAcc} Reactions: ${unit.reactions}` : '',
            `Soldiers: ${soldiersAlive}/4`,
            `Aliens: ${aliensAlive}/${GameData.aliens.length}`,
            `Turn: ${GameData.turn} (#${GameData.turnNumber})`,
            `Mode: ${GameData.actionMode}`,
            `Visible tiles: ${this.countVisibleTiles()}`
        ];

        for (let i = 0; i < this.debugTexts.length; i++) {
            this.debugTexts[i].setText(debugLines[i] || '');
        }
    }

    countVisibleTiles() {
        let count = 0;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (GameData.visibilityMap[y][x] === 2) count++;
            }
        }
        return count;
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }

    create() {
        this.cameras.main.setBackgroundColor(0x003300);

        this.add.text(400, 200, 'MISSION COMPLETE', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#44ff44', fontStyle: 'bold'
        }).setOrigin(0.5);

        const survivors = GameData.soldiers.filter(s => s.alive).length;
        this.add.text(400, 260, `Soldiers survived: ${survivors}/4`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Press R to return to menu', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#888899'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => this.scene.start('MenuScene'));
    }
}

// Defeat Scene
class DefeatScene extends Phaser.Scene {
    constructor() { super('DefeatScene'); }

    create() {
        this.cameras.main.setBackgroundColor(0x330000);

        this.add.text(400, 200, 'MISSION FAILED', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        const aliensLeft = GameData.aliens.filter(a => a.alive).length;
        this.add.text(400, 260, `Aliens remaining: ${aliensLeft}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Press R to return to menu', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#888899'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => this.scene.start('MenuScene'));
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [BootScene, MenuScene, GameScene, VictoryScene, DefeatScene]
};

// Start game
const game = new Phaser.Game(config);
