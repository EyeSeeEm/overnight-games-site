// Frostfall: Skyrim 2D - Phaser 3 Implementation
// Top-down action RPG inspired by Stoneshard

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 50;

// Colors (Stoneshard inspired)
const COLORS = {
    GRASS: 0x4a6a2a,
    GRASS_DARK: 0x3a5a1a,
    GRASS_LIGHT: 0x5a7a3a,
    GRASS_DARKER: 0x2a4a0a,
    DIRT: 0x6a5a4a,
    DIRT_DARK: 0x5a4a3a,
    STONE: 0x5a5a5a,
    STONE_LIGHT: 0x7a7a7a,
    STONE_DARK: 0x3a3a3a,
    SNOW: 0xdde8e8,
    SNOW_DARK: 0xbbd0d0,
    WATER: 0x3a5a7a,
    WATER_DARK: 0x2a4a6a,
    WOOD: 0x8a6a4a,
    WOOD_DARK: 0x5a4030,
    TREE_LIGHT: 0x4a7a3a,
    TREE_MID: 0x3a6a2a,
    TREE_DARK: 0x2a5a1a,
    TREE_TRUNK: 0x4a3a2a,
    PLAYER: 0x5588bb,
    SKIN: 0xe8c8a8,
    UI_BG: 0x12141a,
    UI_PANEL: 0x1a1c24,
    UI_BORDER: 0x3a3c44,
    HEALTH: 0xaa3333,
    MANA: 0x3355aa,
    STAMINA: 0x55aa44,
    GOLD: 0xd4aa44
};

const TERRAIN = {
    GRASS: 0, DIRT: 1, STONE: 2, WATER: 3, SNOW: 4, WALL: 5, TREE: 6, ROCK: 7,
    BUILDING: 8, ROOF: 9, BUSH: 10, FLOWER: 11, PATH: 12, FENCE: 13,
    FARMLAND: 14, HAY: 15, CAMPFIRE: 16
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.map = [];
        this.enemies = [];
        this.npcs = [];
        this.items = [];
        this.particles = [];
        this.damageNumbers = [];
        this.tick = 0;

        this.player = {
            x: 25 * TILE_SIZE, y: 25 * TILE_SIZE,
            width: 14, height: 14,
            speed: 80, facing: 2,
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            stamina: 100, maxStamina: 100,
            level: 1, xp: 0, xpToNext: 100,
            gold: 50, damage: 10, armor: 5,
            attacking: false, attackTimer: 0, attackCooldown: 0,
            inventory: ['Iron Sword', 'Health Potion', 'Health Potion'],
            equipped: { weapon: 'Iron Sword' },
            skills: { combat: 1, magic: 1, stealth: 1 }
        };

        this.gameState = {
            state: 'playing',
            dialogueActive: false,
            dialogueText: '',
            interactTarget: null,
            quests: [],
            messageText: '',
            messageTimer: 0
        };

        this.camera = { x: 0, y: 0 };
        this.graphics = this.add.graphics();

        this.generateWorld();
        this.spawnEntities();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,SHIFT,R');

        // Expose for testing
        window.player = this.player;
        window.gameState = this.gameState;
        window.enemies = this.enemies;
        window.npcs = this.npcs;
    }

    generateWorld() {
        // Initialize map with grass
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                const grassVar = Math.random();
                const variant = grassVar < 0.4 ? 0 : grassVar < 0.7 ? 1 : grassVar < 0.9 ? 2 : 3;
                this.map[y][x] = { terrain: TERRAIN.GRASS, variant };
            }
        }

        // Walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
        }
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
        }

        // Village center
        for (let y = 20; y <= 30; y++) {
            for (let x = 20; x <= 30; x++) {
                this.map[y][x] = { terrain: TERRAIN.DIRT, variant: Math.floor(Math.random() * 3) };
            }
        }

        // Paths
        for (let i = 15; i <= 35; i++) {
            this.map[25][i] = { terrain: TERRAIN.PATH, variant: 0 };
            this.map[i][25] = { terrain: TERRAIN.PATH, variant: 1 };
        }

        // Buildings
        const buildings = [
            { x: 21, y: 21, w: 3, h: 3, type: 'inn' },
            { x: 27, y: 21, w: 3, h: 3, type: 'smith' },
            { x: 21, y: 27, w: 3, h: 3, type: 'shop' },
            { x: 27, y: 27, w: 2, h: 2, type: 'house' }
        ];

        for (const b of buildings) {
            for (let dy = 0; dy < b.h; dy++) {
                for (let dx = 0; dx < b.w; dx++) {
                    if (dy === 0) {
                        this.map[b.y + dy][b.x + dx] = { terrain: TERRAIN.ROOF, variant: b.type === 'inn' ? 1 : 0 };
                    } else {
                        this.map[b.y + dy][b.x + dx] = { terrain: TERRAIN.BUILDING, variant: dx === 1 && dy === b.h - 1 ? 1 : 0 };
                    }
                }
            }
        }

        // River
        for (let y = 8; y <= 42; y++) {
            const wobble = Math.floor(Math.sin(y * 0.3) * 1.5);
            for (let wx = 0; wx < 3; wx++) {
                const rx = 37 + wobble + wx;
                if (rx > 0 && rx < MAP_WIDTH - 1) {
                    this.map[y][rx] = { terrain: TERRAIN.WATER, variant: wx === 1 ? 0 : 1 };
                }
            }
        }

        // Snow area
        for (let y = 1; y < 12; y++) {
            for (let x = 1; x < MAP_WIDTH - 1; x++) {
                if (this.map[y][x].terrain === TERRAIN.GRASS) {
                    this.map[y][x] = { terrain: TERRAIN.SNOW, variant: Math.floor(Math.random() * 2) };
                }
            }
        }

        // Dungeon entrance
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                this.map[7 + dy][8 + dx] = { terrain: TERRAIN.STONE, variant: 2 };
            }
        }
        this.map[9][9] = { terrain: TERRAIN.STONE, variant: 3 };

        // Trees
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x].terrain === TERRAIN.GRASS || this.map[y][x].terrain === TERRAIN.SNOW) {
                    const distFromVillage = Math.abs(x - 25) + Math.abs(y - 25);
                    const treeChance = distFromVillage > 18 ? 0.35 : distFromVillage > 14 ? 0.25 : distFromVillage > 10 ? 0.12 : 0.03;

                    if (Math.random() < treeChance) {
                        this.map[y][x].terrain = TERRAIN.TREE;
                        this.map[y][x].variant = Math.floor(Math.random() * 3);
                    } else if (Math.random() < 0.03) {
                        this.map[y][x].terrain = TERRAIN.ROCK;
                    } else if (Math.random() < 0.06 && this.map[y][x].terrain === TERRAIN.GRASS && distFromVillage > 8) {
                        this.map[y][x].terrain = TERRAIN.BUSH;
                    } else if (Math.random() < 0.03 && this.map[y][x].terrain === TERRAIN.GRASS) {
                        this.map[y][x].terrain = TERRAIN.FLOWER;
                        this.map[y][x].variant = Math.floor(Math.random() * 3);
                    }
                }
            }
        }

        // Fences
        for (let x = 19; x <= 31; x++) {
            if (this.map[19][x].terrain === TERRAIN.GRASS || this.map[19][x].terrain === TERRAIN.DIRT) {
                this.map[19][x] = { terrain: TERRAIN.FENCE, variant: 0 };
            }
            if (this.map[31][x].terrain === TERRAIN.GRASS || this.map[31][x].terrain === TERRAIN.DIRT) {
                this.map[31][x] = { terrain: TERRAIN.FENCE, variant: 0 };
            }
        }

        // Farmland
        for (let y = 32; y <= 38; y++) {
            for (let x = 18; x <= 32; x++) {
                if (this.map[y][x].terrain === TERRAIN.GRASS) {
                    this.map[y][x] = { terrain: TERRAIN.FARMLAND, variant: (x + y) % 2 };
                }
            }
        }
        for (let y = 22; y <= 28; y++) {
            for (let x = 14; x <= 18; x++) {
                if (this.map[y][x].terrain === TERRAIN.GRASS) {
                    this.map[y][x] = { terrain: TERRAIN.FARMLAND, variant: (x + y) % 2 };
                }
            }
        }

        // Hay and campfire
        this.map[33][20] = { terrain: TERRAIN.HAY, variant: 0 };
        this.map[33][30] = { terrain: TERRAIN.HAY, variant: 1 };
        this.map[26][16] = { terrain: TERRAIN.HAY, variant: 0 };
        this.map[25][24] = { terrain: TERRAIN.CAMPFIRE, variant: 0 };
    }

    spawnEntities() {
        // Enemies
        const enemyPositions = [
            { x: 12, y: 30, type: 'bandit' },
            { x: 15, y: 35, type: 'bandit' },
            { x: 40, y: 25, type: 'wolf' },
            { x: 42, y: 28, type: 'wolf' },
            { x: 10, y: 8, type: 'draugr' },
            { x: 12, y: 6, type: 'draugr' }
        ];

        const stats = {
            bandit: { hp: 40, damage: 8, speed: 50, loot: 15 },
            wolf: { hp: 25, damage: 6, speed: 70, loot: 0 },
            draugr: { hp: 60, damage: 12, speed: 40, loot: 25 }
        };

        for (const pos of enemyPositions) {
            const s = stats[pos.type];
            this.enemies.push({
                x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE,
                type: pos.type,
                hp: s.hp, maxHp: s.hp,
                damage: s.damage, speed: s.speed, loot: s.loot,
                state: 'idle', attackCooldown: 0, facing: 2
            });
        }

        // NPCs
        this.npcs.push({
            x: 24 * TILE_SIZE, y: 24 * TILE_SIZE,
            name: 'Innkeeper', type: 'merchant',
            dialogue: 'Welcome to Frostfall! Would you like to rest?',
            quest: null
        });

        this.npcs.push({
            x: 26 * TILE_SIZE, y: 23 * TILE_SIZE,
            name: 'Guard Captain', type: 'questgiver',
            dialogue: 'Bandits have been attacking travelers. Can you help?',
            quest: { id: 'kill_bandits', name: 'Clear the Bandits', target: 'bandit', count: 2, current: 0, reward: 100 }
        });

        this.npcs.push({
            x: 22 * TILE_SIZE, y: 26 * TILE_SIZE,
            name: 'Blacksmith', type: 'merchant',
            dialogue: 'Need weapons? I have the finest steel!',
            quest: null
        });

        // Items
        this.items.push({ x: 15 * TILE_SIZE, y: 20 * TILE_SIZE, type: 'gold', amount: 25 });
        this.items.push({ x: 30 * TILE_SIZE, y: 15 * TILE_SIZE, type: 'potion', name: 'Health Potion' });
        this.items.push({ x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'weapon', name: 'Steel Sword', damage: 15 });
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.tick++;

        if (this.gameState.state === 'playing' && !this.gameState.dialogueActive) {
            this.updatePlayer(dt);
            this.updateEnemies(dt);
            this.updateParticles();
        }

        this.handleInput();
        this.draw();
    }

    updatePlayer(dt) {
        let dx = 0, dy = 0;
        const speed = this.keys.SHIFT.isDown && this.player.stamina > 0 ? this.player.speed * 1.5 : this.player.speed;

        if (this.keys.W.isDown || this.cursors.up.isDown) { dy = -1; this.player.facing = 0; }
        if (this.keys.S.isDown || this.cursors.down.isDown) { dy = 1; this.player.facing = 2; }
        if (this.keys.A.isDown || this.cursors.left.isDown) { dx = -1; this.player.facing = 3; }
        if (this.keys.D.isDown || this.cursors.right.isDown) { dx = 1; this.player.facing = 1; }

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (this.canMove(newX, this.player.y)) this.player.x = newX;
            if (this.canMove(this.player.x, newY)) this.player.y = newY;

            if (this.keys.SHIFT.isDown) {
                this.player.stamina = Math.max(0, this.player.stamina - 5 * dt);
            }
        }

        // Stamina regen
        if (!this.keys.SHIFT.isDown && this.player.stamina < this.player.maxStamina) {
            this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 10 * dt);
        }

        // Attack timer
        if (this.player.attacking) {
            this.player.attackTimer -= dt;
            if (this.player.attackTimer <= 0) this.player.attacking = false;
        }
        if (this.player.attackCooldown > 0) this.player.attackCooldown -= dt;

        // Update camera
        this.camera.x = this.player.x - 320;
        this.camera.y = this.player.y - 240;
        this.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - 640, this.camera.x));
        this.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - 480, this.camera.y));
    }

    canMove(x, y) {
        const tiles = [
            { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
            { x: Math.floor((x + 12) / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
            { x: Math.floor(x / TILE_SIZE), y: Math.floor((y + 12) / TILE_SIZE) },
            { x: Math.floor((x + 12) / TILE_SIZE), y: Math.floor((y + 12) / TILE_SIZE) }
        ];

        for (const tile of tiles) {
            if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
            const t = this.map[tile.y][tile.x].terrain;
            if (t === TERRAIN.WALL || t === TERRAIN.WATER || t === TERRAIN.TREE ||
                t === TERRAIN.ROCK || t === TERRAIN.BUILDING || t === TERRAIN.ROOF || t === TERRAIN.FENCE) {
                return false;
            }
        }
        return true;
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

            if (enemy.state === 'idle' && dist < 100) {
                enemy.state = 'chase';
            }

            if (enemy.state === 'chase') {
                if (dist > 200) {
                    enemy.state = 'idle';
                } else if (dist < 20) {
                    enemy.attackCooldown -= dt;
                    if (enemy.attackCooldown <= 0) {
                        this.player.hp -= Math.max(1, enemy.damage - this.player.armor);
                        this.addDamageNumber(this.player.x, this.player.y, enemy.damage);
                        enemy.attackCooldown = 1;
                        if (this.player.hp <= 0) this.gameState.state = 'gameover';
                    }
                } else {
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const newX = enemy.x + (dx / len) * enemy.speed * dt;
                    const newY = enemy.y + (dy / len) * enemy.speed * dt;
                    if (this.canMove(newX, enemy.y)) enemy.x = newX;
                    if (this.canMove(enemy.x, newY)) enemy.y = newY;
                }
            }
        }
    }

    updateParticles() {
        // Snow particles
        if (this.camera.y < 12 * TILE_SIZE && this.particles.length < 50) {
            if (Math.random() < 0.3) {
                this.particles.push({
                    x: this.camera.x + Math.random() * 640,
                    y: this.camera.y - 10,
                    speed: 20 + Math.random() * 30,
                    drift: (Math.random() - 0.5) * 20,
                    size: 1 + Math.random() * 2
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.speed * 0.016;
            p.x += p.drift * 0.016;
            if (p.y > this.camera.y + 500) this.particles.splice(i, 1);
        }
    }

    handleInput() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            if (!this.gameState.dialogueActive) {
                this.playerAttack();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            if (this.gameState.dialogueActive) {
                this.gameState.dialogueActive = false;
                const target = this.gameState.interactTarget;
                if (target?.quest && !this.gameState.quests.some(q => q.id === target.quest.id)) {
                    this.gameState.quests.push({ ...target.quest });
                    this.showMessage(`Quest accepted: ${target.quest.name}`);
                }
            } else {
                this.interact();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.R) && this.gameState.state === 'gameover') {
            this.scene.restart();
        }
    }

    playerAttack() {
        if (this.player.attackCooldown > 0 || this.player.attacking) return;

        this.player.attacking = true;
        this.player.attackTimer = 0.3;
        this.player.attackCooldown = 0.5;

        const attackRange = 24;
        const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI];
        const facingAngle = angles[this.player.facing];

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = (enemy.x + 7) - (this.player.x + 7);
            const dy = (enemy.y + 7) - (this.player.y + 7);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < attackRange) {
                const angle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(angle - facingAngle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (angleDiff < Math.PI / 4) {
                    const damage = this.player.damage + Math.floor(this.player.skills.combat * 0.5);
                    enemy.hp -= damage;
                    this.addDamageNumber(enemy.x, enemy.y, damage);

                    if (enemy.hp <= 0) {
                        if (enemy.loot > 0) {
                            this.items.push({ x: enemy.x, y: enemy.y, type: 'gold', amount: enemy.loot });
                        }
                        this.player.xp += 20;
                        if (this.player.xp >= this.player.xpToNext) this.levelUp();

                        for (const quest of this.gameState.quests) {
                            if (quest.target === enemy.type && quest.current < quest.count) {
                                quest.current++;
                                this.showMessage(`Quest progress: ${quest.current}/${quest.count}`);
                            }
                        }
                        this.enemies.splice(i, 1);
                    }
                }
            }
        }
    }

    interact() {
        // NPCs
        for (const npc of this.npcs) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < 30) {
                this.gameState.dialogueActive = true;
                this.gameState.dialogueText = npc.dialogue;
                this.gameState.interactTarget = npc;
                return;
            }
        }

        // Items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 24) {
                if (item.type === 'gold') {
                    this.player.gold += item.amount;
                    this.showMessage(`Picked up ${item.amount} gold`);
                } else if (item.type === 'potion') {
                    this.player.inventory.push(item.name);
                    this.showMessage(`Picked up ${item.name}`);
                } else if (item.type === 'weapon') {
                    this.player.inventory.push(item.name);
                    this.player.damage = item.damage;
                    this.showMessage(`Equipped ${item.name}!`);
                }
                this.items.splice(i, 1);
                return;
            }
        }
    }

    levelUp() {
        this.player.level++;
        this.player.xp = 0;
        this.player.xpToNext = this.player.level * 100;
        this.player.maxHp += 10;
        this.player.hp = this.player.maxHp;
        this.player.damage += 2;
        this.showMessage(`Level Up! You are now level ${this.player.level}`);
    }

    showMessage(text) {
        this.gameState.messageText = text;
        this.gameState.messageTimer = 180;
    }

    addDamageNumber(x, y, amount) {
        this.damageNumbers.push({ x, y, amount, timer: 60 });
    }

    draw() {
        this.graphics.clear();

        // Background
        this.graphics.fillStyle(0x1a1a1a);
        this.graphics.fillRect(0, 0, 640, 480);

        this.drawMap();
        this.drawItems();
        this.drawEntities();
        this.drawPlayer();
        this.drawParticles();
        this.drawDamageNumbers();
        this.drawUI();

        if (this.gameState.dialogueActive) this.drawDialogue();
        if (this.gameState.state === 'gameover') this.drawGameOver();
    }

    drawMap() {
        const startX = Math.floor(this.camera.x / TILE_SIZE);
        const startY = Math.floor(this.camera.y / TILE_SIZE);
        const endX = Math.min(MAP_WIDTH, startX + 42);
        const endY = Math.min(MAP_HEIGHT, startY + 32);

        // Ground pass
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.map[y][x];
                const screenX = Math.floor(x * TILE_SIZE - this.camera.x);
                const screenY = Math.floor(y * TILE_SIZE - this.camera.y);
                this.drawTile(tile, screenX, screenY, x, y);
            }
        }

        // Tree pass
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                if (this.map[y][x].terrain === TERRAIN.TREE) {
                    const screenX = Math.floor(x * TILE_SIZE - this.camera.x);
                    const screenY = Math.floor(y * TILE_SIZE - this.camera.y);
                    this.drawTree(screenX, screenY, this.map[y][x].variant);
                }
            }
        }
    }

    drawTile(tile, screenX, screenY, tileX, tileY) {
        const t = tile.terrain;
        const v = tile.variant;

        switch (t) {
            case TERRAIN.GRASS:
                const grassColors = [COLORS.GRASS, COLORS.GRASS_DARK, COLORS.GRASS_LIGHT, COLORS.GRASS_DARKER];
                this.graphics.fillStyle(grassColors[v] || COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                const tuftSeed = (tileX * 17 + tileY * 31) % 7;
                if (tuftSeed === 0) {
                    this.graphics.fillStyle(COLORS.GRASS_DARK);
                    this.graphics.fillRect(screenX + 2, screenY + 10, 2, 5);
                    this.graphics.fillRect(screenX + 6, screenY + 11, 2, 4);
                } else if (tuftSeed === 2) {
                    this.graphics.fillStyle(0x5a5a5a);
                    this.graphics.fillRect(screenX + 5, screenY + 11, 3, 2);
                }
                break;

            case TERRAIN.DIRT:
                this.graphics.fillStyle(v === 0 ? COLORS.DIRT : COLORS.DIRT_DARK);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                break;

            case TERRAIN.PATH:
                this.graphics.fillStyle(COLORS.STONE);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.STONE_LIGHT);
                this.graphics.fillRect(screenX + 2, screenY + 2, 4, 4);
                break;

            case TERRAIN.STONE:
                this.graphics.fillStyle(v === 2 ? COLORS.STONE_DARK : COLORS.STONE);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                if (v === 3) {
                    this.graphics.fillStyle(0x1a1a1a);
                    this.graphics.fillRect(screenX + 3, screenY + 3, 10, 10);
                }
                break;

            case TERRAIN.WATER:
                this.graphics.fillStyle(v === 0 ? COLORS.WATER : COLORS.WATER_DARK);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                if (Math.sin((this.tick * 0.08) + tileX * 0.5) > 0.3) {
                    this.graphics.fillStyle(0x6496c8, 0.25);
                    this.graphics.fillRect(screenX + 2, screenY + 4, 8, 2);
                }
                break;

            case TERRAIN.SNOW:
                this.graphics.fillStyle(v === 0 ? COLORS.SNOW : COLORS.SNOW_DARK);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                break;

            case TERRAIN.WALL:
                this.graphics.fillStyle(0x2a2a2a);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                break;

            case TERRAIN.BUILDING:
                this.graphics.fillStyle(COLORS.WOOD_DARK);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.WOOD);
                this.graphics.fillRect(screenX + 1, screenY + 2, 14, 4);
                this.graphics.fillRect(screenX + 1, screenY + 10, 14, 4);
                if (v === 1) {
                    this.graphics.fillStyle(0x5a4a3a);
                    this.graphics.fillRect(screenX + 4, screenY + 2, 8, 14);
                }
                break;

            case TERRAIN.ROOF:
                this.graphics.fillStyle(v === 1 ? 0x7a5040 : 0x6a4535);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(v === 1 ? 0x8a6050 : 0x7a5545);
                this.graphics.fillRect(screenX, screenY + 4, TILE_SIZE, 4);
                break;

            case TERRAIN.BUSH:
                this.graphics.fillStyle(COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.TREE_DARK);
                this.graphics.fillCircle(screenX + 8, screenY + 10, 6);
                this.graphics.fillStyle(COLORS.TREE_MID);
                this.graphics.fillCircle(screenX + 6, screenY + 8, 4);
                break;

            case TERRAIN.FLOWER:
                this.graphics.fillStyle(COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                const flowerColors = [0xdd6666, 0xdddd66, 0x6666dd];
                this.graphics.fillStyle(flowerColors[v]);
                this.graphics.fillRect(screenX + 5, screenY + 5, 6, 4);
                break;

            case TERRAIN.FENCE:
                this.graphics.fillStyle(COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.WOOD_DARK);
                this.graphics.fillRect(screenX, screenY + 6, TILE_SIZE, 4);
                this.graphics.fillStyle(COLORS.WOOD);
                this.graphics.fillRect(screenX + 2, screenY + 4, 2, 8);
                this.graphics.fillRect(screenX + 12, screenY + 4, 2, 8);
                break;

            case TERRAIN.ROCK:
                this.graphics.fillStyle(COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.STONE);
                this.graphics.fillRect(screenX + 3, screenY + 6, 10, 8);
                this.graphics.fillStyle(COLORS.STONE_LIGHT);
                this.graphics.fillRect(screenX + 5, screenY + 8, 4, 3);
                break;

            case TERRAIN.FARMLAND:
                this.graphics.fillStyle(v === 0 ? 0x4a3a2a : 0x5a4a3a);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(0x3a2a1a);
                this.graphics.fillRect(screenX, screenY + 2, TILE_SIZE, 2);
                this.graphics.fillRect(screenX, screenY + 8, TILE_SIZE, 2);
                this.graphics.fillRect(screenX, screenY + 14, TILE_SIZE, 2);
                if ((tileX * 3 + tileY * 7) % 4 === 0) {
                    this.graphics.fillStyle(0x5a8a4a);
                    this.graphics.fillRect(screenX + 4, screenY + 4, 3, 4);
                }
                break;

            case TERRAIN.HAY:
                this.graphics.fillStyle(COLORS.DIRT);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(0xc4a444);
                this.graphics.fillRect(screenX + 2, screenY + 4, 12, 10);
                this.graphics.fillStyle(0xd4b454);
                this.graphics.fillRect(screenX + 3, screenY + 5, 10, 4);
                break;

            case TERRAIN.CAMPFIRE:
                this.graphics.fillStyle(COLORS.DIRT);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.graphics.fillStyle(COLORS.STONE);
                this.graphics.fillRect(screenX + 2, screenY + 10, 12, 4);
                const flicker = Math.sin(this.tick * 0.2) * 2;
                this.graphics.fillStyle(0xff6622);
                this.graphics.fillTriangle(screenX + 8, screenY + 2 + flicker, screenX + 12, screenY + 10, screenX + 4, screenY + 10);
                this.graphics.fillStyle(0xffaa44);
                this.graphics.fillTriangle(screenX + 8, screenY + 4 + flicker, screenX + 10, screenY + 9, screenX + 6, screenY + 9);
                break;

            case TERRAIN.TREE:
                this.graphics.fillStyle(COLORS.GRASS);
                this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                break;
        }
    }

    drawTree(screenX, screenY, variant) {
        const size = variant === 2 ? 1.4 : variant === 1 ? 1.2 : 1.0;
        const trunkColor = variant === 2 ? 0x5a4030 : 0x4a3525;

        // Shadow
        this.graphics.fillStyle(0x000000, 0.3);
        this.graphics.fillEllipse(screenX + 8, screenY + 15, 7 * size, 3);

        // Trunk
        this.graphics.fillStyle(trunkColor);
        this.graphics.fillRect(screenX + 5, screenY + 6, 6, 10);

        // Pine layers
        this.graphics.fillStyle(COLORS.TREE_DARK);
        this.graphics.fillTriangle(screenX + 8, screenY - 2 * size, screenX + 16, screenY + 12, screenX, screenY + 12);
        this.graphics.fillStyle(COLORS.TREE_MID);
        this.graphics.fillTriangle(screenX + 8, screenY - 6 * size, screenX + 14, screenY + 6, screenX + 2, screenY + 6);
        this.graphics.fillStyle(COLORS.TREE_LIGHT);
        this.graphics.fillTriangle(screenX + 8, screenY - 10 * size, screenX + 12, screenY, screenX + 4, screenY);

        // Snow on tree
        if (screenY + this.camera.y < 12 * TILE_SIZE) {
            this.graphics.fillStyle(COLORS.SNOW);
            this.graphics.fillRect(screenX + 5, screenY - 8 * size, 6, 3);
            this.graphics.fillRect(screenX + 3, screenY - 2, 4, 2);
        }
    }

    drawItems() {
        for (const item of this.items) {
            const screenX = item.x - this.camera.x;
            const screenY = item.y - this.camera.y;

            if (item.type === 'gold') {
                this.graphics.fillStyle(COLORS.GOLD);
                this.graphics.fillCircle(screenX + 8, screenY + 8, 4);
            } else if (item.type === 'potion') {
                this.graphics.fillStyle(0xcc4466);
                this.graphics.fillRect(screenX + 5, screenY + 3, 6, 10);
            } else if (item.type === 'weapon') {
                this.graphics.fillStyle(0xaaaaaa);
                this.graphics.fillRect(screenX + 7, screenY + 2, 2, 12);
            }
        }
    }

    drawEntities() {
        // NPCs
        for (const npc of this.npcs) {
            const screenX = npc.x - this.camera.x;
            const screenY = npc.y - this.camera.y;

            this.graphics.fillStyle(0x000000, 0.3);
            this.graphics.fillEllipse(screenX + 8, screenY + 14, 5, 2);

            const bodyColor = npc.type === 'merchant' ? 0x6a5a4a : npc.type === 'questgiver' ? 0x4a5a6a : 0x66aa55;
            this.graphics.fillStyle(bodyColor);
            this.graphics.fillRect(screenX + 4, screenY + 4, 8, 10);

            this.graphics.fillStyle(COLORS.SKIN);
            this.graphics.fillRect(screenX + 5, screenY - 1, 6, 6);

            if (npc.quest && !this.gameState.quests.some(q => q.id === npc.quest.id)) {
                this.graphics.fillStyle(COLORS.GOLD);
                this.graphics.fillRect(screenX + 5, screenY - 12, 4, 8);
            }
        }

        // Enemies
        for (const enemy of this.enemies) {
            const screenX = enemy.x - this.camera.x;
            const screenY = enemy.y - this.camera.y;

            this.graphics.fillStyle(0x000000, 0.3);
            this.graphics.fillEllipse(screenX + 8, screenY + 14, 5, 2);

            if (enemy.type === 'wolf') {
                this.graphics.fillStyle(0x6a6a6a);
                this.graphics.fillRect(screenX + 2, screenY + 6, 12, 6);
                this.graphics.fillStyle(0x7a7a7a);
                this.graphics.fillRect(screenX + 10, screenY + 4, 5, 5);
            } else if (enemy.type === 'draugr') {
                this.graphics.fillStyle(0x4a5a5a);
                this.graphics.fillRect(screenX + 4, screenY + 4, 8, 10);
                this.graphics.fillStyle(0x6a7a7a);
                this.graphics.fillRect(screenX + 5, screenY - 1, 6, 6);
                this.graphics.fillStyle(0x4488ff);
                this.graphics.fillRect(screenX + 6, screenY + 1, 1, 1);
                this.graphics.fillRect(screenX + 9, screenY + 1, 1, 1);
            } else {
                this.graphics.fillStyle(0x7a5a4a);
                this.graphics.fillRect(screenX + 4, screenY + 4, 8, 10);
                this.graphics.fillStyle(0xd8b8a0);
                this.graphics.fillRect(screenX + 5, screenY - 1, 6, 6);
            }

            if (enemy.hp < enemy.maxHp) {
                this.graphics.fillStyle(0x331111);
                this.graphics.fillRect(screenX, screenY - 6, 16, 4);
                this.graphics.fillStyle(COLORS.HEALTH);
                this.graphics.fillRect(screenX, screenY - 6, 16 * (enemy.hp / enemy.maxHp), 4);
            }
        }
    }

    drawPlayer() {
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;

        this.graphics.fillStyle(0x000000, 0.3);
        this.graphics.fillEllipse(screenX + 8, screenY + 14, 5, 2);

        this.graphics.fillStyle(0x5577aa);
        this.graphics.fillRect(screenX + 4, screenY + 4, 8, 10);

        this.graphics.fillStyle(COLORS.SKIN);
        this.graphics.fillRect(screenX + 5, screenY - 1, 6, 6);

        this.graphics.fillStyle(0x4a3a2a);
        this.graphics.fillRect(screenX + 5, screenY - 2, 6, 3);

        if (this.player.attacking) {
            this.graphics.fillStyle(0x888888);
            this.graphics.fillRect(screenX + 10, screenY - 6, 3, 14);
        }
    }

    drawParticles() {
        this.graphics.fillStyle(0xffffff, 0.8);
        for (const p of this.particles) {
            const screenX = p.x - this.camera.x;
            const screenY = p.y - this.camera.y;
            this.graphics.fillCircle(screenX, screenY, p.size);
        }
    }

    drawDamageNumbers() {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.timer--;
            if (dn.timer <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    drawUI() {
        const panelY = 410;

        // Bottom panel
        this.graphics.fillStyle(COLORS.UI_PANEL);
        this.graphics.fillRect(0, panelY, 640, 70);
        this.graphics.fillStyle(COLORS.UI_BORDER);
        this.graphics.fillRect(0, panelY, 640, 2);

        // Health bar
        this.graphics.fillStyle(0x331111);
        this.graphics.fillRect(15, panelY + 10, 120, 14);
        this.graphics.fillStyle(COLORS.HEALTH);
        this.graphics.fillRect(15, panelY + 10, 120 * (this.player.hp / this.player.maxHp), 14);

        // Mana bar
        this.graphics.fillStyle(0x111133);
        this.graphics.fillRect(15, panelY + 28, 120, 14);
        this.graphics.fillStyle(COLORS.MANA);
        this.graphics.fillRect(15, panelY + 28, 120 * (this.player.mp / this.player.maxMp), 14);

        // Stamina bar
        this.graphics.fillStyle(0x113311);
        this.graphics.fillRect(15, panelY + 46, 120, 14);
        this.graphics.fillStyle(COLORS.STAMINA);
        this.graphics.fillRect(15, panelY + 46, 120 * (this.player.stamina / this.player.maxStamina), 14);

        // Inventory slots
        for (let i = 0; i < 8; i++) {
            const sx = 192 + i * 32;
            this.graphics.fillStyle(COLORS.UI_BG);
            this.graphics.fillRect(sx, panelY + 20, 28, 28);
            this.graphics.lineStyle(1, COLORS.UI_BORDER);
            this.graphics.strokeRect(sx, panelY + 20, 28, 28);
        }

        // Stats
        this.graphics.fillStyle(COLORS.UI_BG);
        this.graphics.fillRect(530, panelY + 8, 100, 54);

        // Quest tracker
        if (this.gameState.quests.length > 0) {
            this.graphics.fillStyle(COLORS.UI_BG, 0.9);
            this.graphics.fillRect(10, 10, 200, 25 + this.gameState.quests.length * 18);
        }

        // Minimap
        this.graphics.fillStyle(COLORS.UI_BG);
        this.graphics.fillRect(290, 10, 60, 60);
        this.graphics.lineStyle(1, COLORS.UI_BORDER);
        this.graphics.strokeRect(290, 10, 60, 60);
        this.graphics.fillStyle(COLORS.GRASS_DARK);
        this.graphics.fillRect(291, 11, 58, 58);
        const mmScale = 58 / (MAP_WIDTH * TILE_SIZE);
        this.graphics.fillStyle(0xffffff);
        this.graphics.fillRect(291 + this.player.x * mmScale, 11 + this.player.y * mmScale, 3, 3);

        // Message
        if (this.gameState.messageTimer > 0) {
            this.gameState.messageTimer--;
            this.graphics.fillStyle(COLORS.UI_BG, 0.95);
            this.graphics.fillRect(220, 80, 200, 30);
            this.graphics.lineStyle(1, COLORS.GOLD);
            this.graphics.strokeRect(220, 80, 200, 30);
        }
    }

    drawDialogue() {
        this.graphics.fillStyle(0x000000, 0.9);
        this.graphics.fillRect(50, 330, 540, 100);
        this.graphics.lineStyle(1, COLORS.UI_BORDER);
        this.graphics.strokeRect(50, 330, 540, 100);
    }

    drawGameOver() {
        this.graphics.fillStyle(0x000000, 0.8);
        this.graphics.fillRect(0, 0, 640, 480);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 640,
    height: 480,
    parent: 'game',
    backgroundColor: '#1a1a1a',
    scene: [GameScene]
};

const game = new Phaser.Game(config);
