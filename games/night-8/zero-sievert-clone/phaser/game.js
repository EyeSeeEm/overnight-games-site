// Zero Sievert Clone - Phaser 3 Implementation

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const VIEW_RANGE = 250;
const VISION_CONE_ANGLE = Math.PI / 2;

// Weapon definitions
const WEAPONS = {
    pistol: { name: 'PM Pistol', damage: 18, fireRate: 300, range: 150, spread: 8, magSize: 8, reloadTime: 1500 },
    smg: { name: 'Skorpion', damage: 14, fireRate: 100, range: 120, spread: 12, magSize: 20, reloadTime: 2000 },
    shotgun: { name: 'Pump Shotgun', damage: 8, fireRate: 1000, range: 80, spread: 25, pellets: 8, magSize: 6, reloadTime: 3000 },
    rifle: { name: 'AK-74', damage: 28, fireRate: 150, range: 200, spread: 6, magSize: 30, reloadTime: 2500 }
};

// Enemy types
const ENEMY_TYPES = {
    wolf: { name: 'Wolf', hp: 40, damage: 15, speed: 80, color: 0x666688, type: 'melee', aggro: 150 },
    boar: { name: 'Boar', hp: 80, damage: 20, speed: 60, color: 0x886644, type: 'charge', aggro: 100 },
    banditMelee: { name: 'Bandit', hp: 60, damage: 12, speed: 50, color: 0xaa6644, type: 'melee', aggro: 200 },
    banditPistol: { name: 'Bandit (Pistol)', hp: 60, damage: 15, speed: 40, color: 0xcc8866, type: 'ranged', fireRate: 800, aggro: 250 },
    banditRifle: { name: 'Bandit (Rifle)', hp: 80, damage: 25, speed: 35, color: 0xaa8844, type: 'ranged', fireRate: 400, aggro: 300 }
};

// Game data
const GameData = {
    map: [],
    player: null,
    enemies: [],
    bullets: [],
    lootContainers: [],
    bloodSplatters: [],
    extractionPoint: null,
    score: 0,
    kills: 0,
    lootCollected: 0,
    gameTime: 0,
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
        this.cameras.main.setBackgroundColor(0x0a0a1a);

        this.add.text(400, 120, 'ZERO SIEVERT', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 160, 'Extraction Shooter Clone', {
            fontSize: '18px', fontFamily: 'Courier New', color: '#888899'
        }).setOrigin(0.5);

        this.add.text(400, 240, 'Press SPACE or Click to Start', {
            fontSize: '16px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setOrigin(0.5);

        this.add.text(400, 310, 'Controls:', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#667788'
        }).setOrigin(0.5);

        const controls = [
            'WASD - Move | Mouse - Aim',
            'LMB - Fire | R - Reload',
            'E - Loot | 1-4 - Weapons',
            'Shift - Sprint | Q - Debug'
        ];

        controls.forEach((text, i) => {
            this.add.text(400, 335 + i * 22, text, {
                fontSize: '12px', fontFamily: 'Courier New', color: '#667788'
            }).setOrigin(0.5);
        });

        this.add.text(400, 480, 'Objective: Reach extraction point alive!', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#44ff44'
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
    GameData.map = [];
    GameData.enemies = [];
    GameData.bullets = [];
    GameData.lootContainers = [];
    GameData.bloodSplatters = [];
    GameData.score = 0;
    GameData.kills = 0;
    GameData.lootCollected = 0;
    GameData.gameTime = 0;
    GameData.showDebug = false;
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor(0x1a1a2a);

        this.generateMap();
        this.spawnPlayer();
        this.spawnEnemies();
        this.spawnLoot();
        this.placeExtraction();

        // Graphics
        this.mapGraphics = this.add.graphics();
        this.bloodGraphics = this.add.graphics();
        this.unitGraphics = this.add.graphics();
        this.bulletGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        // Set up camera to follow player
        this.cameras.main.startFollow({ x: GameData.player.x, y: GameData.player.y }, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        this.setupInput();
        this.createUI();

        this.lastFireTime = 0;
    }

    generateMap() {
        GameData.map = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            GameData.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                let tile = { type: 'grass', walkable: true, color: 0x2a4a2a };

                if (Math.random() < 0.3) {
                    tile.color = (x + y) % 2 === 0 ? 0x2a4a2a : 0x1a3a1a;
                }

                if ((x >= 18 && x <= 22) || (y >= 18 && y <= 22)) {
                    tile = { type: 'dirt', walkable: true, color: 0x4a3a2a };
                }

                GameData.map[y][x] = tile;
            }
        }

        // Buildings
        this.addBuilding(5, 5, 6, 5);
        this.addBuilding(25, 8, 5, 4);
        this.addBuilding(10, 25, 7, 5);
        this.addBuilding(30, 28, 5, 6);

        // Trees
        for (let i = 0; i < 80; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (GameData.map[y][x].walkable && GameData.map[y][x].type !== 'floor') {
                GameData.map[y][x] = { type: 'tree', walkable: false, color: 0x1a3a1a };
            }
        }

        // Bushes
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (GameData.map[y][x].walkable && GameData.map[y][x].type === 'grass') {
                GameData.map[y][x] = { type: 'bush', walkable: true, color: 0x3a5a3a };
            }
        }
    }

    addBuilding(startX, startY, width, height) {
        for (let y = startY; y < startY + height && y < MAP_HEIGHT; y++) {
            for (let x = startX; x < startX + width && x < MAP_WIDTH; x++) {
                if (x === startX || x === startX + width - 1 || y === startY || y === startY + height - 1) {
                    if (y === startY + height - 1 && x === startX + Math.floor(width / 2)) {
                        GameData.map[y][x] = { type: 'door', walkable: true, color: 0x5a4a3a };
                    } else {
                        GameData.map[y][x] = { type: 'wall', walkable: false, color: 0x4a4a5a };
                    }
                } else {
                    GameData.map[y][x] = { type: 'floor', walkable: true, color: 0x5a5a6a };
                }
            }
        }
    }

    spawnPlayer() {
        GameData.player = {
            x: 2 * TILE_SIZE + TILE_SIZE / 2,
            y: 2 * TILE_SIZE + TILE_SIZE / 2,
            speed: 100,
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            angle: 0,
            weapon: { ...WEAPONS.pistol, currentAmmo: 8 },
            inventory: [
                { type: 'weapon', weapon: { ...WEAPONS.pistol, currentAmmo: 8 } },
                { type: 'weapon', weapon: { ...WEAPONS.smg, currentAmmo: 20 } }
            ],
            bleeding: 0,
            reloading: false,
            reloadStart: 0
        };
    }

    spawnEnemies() {
        GameData.enemies = [];

        // Wolves
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy('wolf', 8 + Math.random() * 10, 8 + Math.random() * 10);
        }

        // Boars
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy('boar', 30 + Math.random() * 8, 5 + Math.random() * 8);
        }

        // Bandits
        this.spawnEnemy('banditMelee', 8, 12);
        this.spawnEnemy('banditPistol', 27, 10);
        this.spawnEnemy('banditRifle', 12, 28);
        this.spawnEnemy('banditPistol', 32, 30);
        this.spawnEnemy('banditMelee', 5, 34);

        for (let i = 0; i < 4; i++) {
            const types = ['banditMelee', 'banditPistol', 'banditRifle'];
            this.spawnEnemy(types[Math.floor(Math.random() * types.length)],
                5 + Math.random() * 30, 5 + Math.random() * 30);
        }
    }

    spawnEnemy(type, tileX, tileY) {
        const def = ENEMY_TYPES[type];
        GameData.enemies.push({
            x: tileX * TILE_SIZE + TILE_SIZE / 2,
            y: tileY * TILE_SIZE + TILE_SIZE / 2,
            type: type,
            hp: def.hp,
            maxHp: def.hp,
            speed: def.speed,
            damage: def.damage,
            color: def.color,
            behavior: def.type,
            fireRate: def.fireRate || 0,
            lastFire: 0,
            aggro: def.aggro,
            angle: Math.random() * Math.PI * 2,
            state: 'idle',
            alertTimer: 0
        });
    }

    spawnLoot() {
        GameData.lootContainers = [];
        GameData.bloodSplatters = [];
        GameData.bullets = [];

        const lootPositions = [
            { x: 7, y: 7, items: ['medkit', 'bandage', 'bandage'] },
            { x: 26, y: 9, items: ['bandage', 'ammo', 'medkit'] },
            { x: 12, y: 27, items: ['weapon_smg', 'ammo', 'bandage'] },
            { x: 31, y: 30, items: ['medkit', 'bandage', 'ammo'] }
        ];

        for (const pos of lootPositions) {
            GameData.lootContainers.push({
                x: pos.x * TILE_SIZE + TILE_SIZE / 2,
                y: pos.y * TILE_SIZE + TILE_SIZE / 2,
                items: pos.items,
                opened: false
            });
        }

        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (GameData.map[y][x].walkable) {
                GameData.lootContainers.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    items: Math.random() < 0.6 ? ['bandage', 'bandage'] : ['ammo', 'bandage'],
                    opened: false
                });
            }
        }
    }

    placeExtraction() {
        GameData.extractionPoint = {
            x: (MAP_WIDTH - 3) * TILE_SIZE,
            y: (MAP_HEIGHT - 3) * TILE_SIZE,
            radius: 40,
            timer: 0,
            extracting: false
        };
    }

    setupInput() {
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR
        });

        this.input.keyboard.on('keydown-Q', () => {
            GameData.showDebug = !GameData.showDebug;
        });

        this.input.keyboard.on('keydown-E', () => {
            this.interactWithLoot();
        });

        this.input.keyboard.on('keydown-ONE', () => this.switchWeapon('pistol'));
        this.input.keyboard.on('keydown-TWO', () => this.switchWeapon('smg'));
        this.input.keyboard.on('keydown-THREE', () => this.switchWeapon('shotgun'));
        this.input.keyboard.on('keydown-FOUR', () => this.switchWeapon('rifle'));
    }

    createUI() {
        // HP text
        this.hpText = this.add.text(10, 10, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        this.weaponText = this.add.text(10, 55, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setScrollFactor(0).setDepth(100);

        this.ammoText = this.add.text(10, 75, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setScrollFactor(0).setDepth(100);

        this.bleedText = this.add.text(170, 15, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#ff4444'
        }).setScrollFactor(0).setDepth(100);

        this.scoreText = this.add.text(790, 10, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#ffffff'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        this.extractText = this.add.text(790, 80, '', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#44ff44'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        this.controlsText = this.add.text(10, 580, 'WASD:Move LMB:Fire R:Reload E:Loot 1-4:Weapons Q:Debug', {
            fontSize: '11px', fontFamily: 'Courier New', color: '#667788'
        }).setScrollFactor(0).setDepth(100);

        // Debug texts
        this.debugTexts = [];
        for (let i = 0; i < 12; i++) {
            this.debugTexts.push(
                this.add.text(10, 110 + i * 14, '', {
                    fontSize: '11px', fontFamily: 'Courier New', color: '#00ff00'
                }).setScrollFactor(0).setDepth(100)
            );
        }
    }

    update(time, delta) {
        const dt = delta / 1000;
        GameData.gameTime += dt;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateBullets();
        this.checkExtraction(dt);

        // Bleeding
        if (GameData.player.bleeding > 0) {
            GameData.player.hp -= GameData.player.bleeding * dt;
            GameData.player.bleeding -= dt / 5;
            if (GameData.player.bleeding < 0) GameData.player.bleeding = 0;
        }

        // Check death
        if (GameData.player.hp <= 0) {
            this.scene.start('GameOverScene');
        }

        // Update camera target
        this.cameras.main.centerOn(GameData.player.x, GameData.player.y);

        this.render();
        this.updateUI();
    }

    updatePlayer(dt) {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        GameData.player.angle = Phaser.Math.Angle.Between(
            GameData.player.x, GameData.player.y, worldPoint.x, worldPoint.y);

        let dx = 0, dy = 0;
        let speed = GameData.player.speed;

        if (this.cursors.shift.isDown && GameData.player.stamina > 0) {
            speed *= 1.5;
            GameData.player.stamina -= dt * 20;
        } else if (GameData.player.stamina < GameData.player.maxStamina) {
            GameData.player.stamina += dt * 10;
        }

        if (this.cursors.w.isDown) dy -= speed;
        if (this.cursors.s.isDown) dy += speed;
        if (this.cursors.a.isDown) dx -= speed;
        if (this.cursors.d.isDown) dx += speed;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const newX = GameData.player.x + dx * dt;
        const newY = GameData.player.y + dy * dt;

        if (this.canMoveTo(newX, GameData.player.y)) GameData.player.x = newX;
        if (this.canMoveTo(GameData.player.x, newY)) GameData.player.y = newY;

        // Reload
        if (this.cursors.r.isDown && !GameData.player.reloading &&
            GameData.player.weapon.currentAmmo < GameData.player.weapon.magSize) {
            GameData.player.reloading = true;
            GameData.player.reloadStart = this.time.now;
        }

        if (GameData.player.reloading &&
            this.time.now - GameData.player.reloadStart >= GameData.player.weapon.reloadTime) {
            GameData.player.weapon.currentAmmo = GameData.player.weapon.magSize;
            GameData.player.reloading = false;
        }

        // Shooting
        if (pointer.isDown && !GameData.player.reloading) {
            if (this.time.now - this.lastFireTime >= GameData.player.weapon.fireRate &&
                GameData.player.weapon.currentAmmo > 0) {
                this.fireWeapon();
                this.lastFireTime = this.time.now;
            }
        }
    }

    canMoveTo(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
        return GameData.map[tileY][tileX].walkable;
    }

    fireWeapon() {
        GameData.player.weapon.currentAmmo--;
        const pellets = GameData.player.weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spreadRad = (GameData.player.weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
            const angle = GameData.player.angle + spreadRad;

            GameData.bullets.push({
                x: GameData.player.x,
                y: GameData.player.y,
                vx: Math.cos(angle) * 500,
                vy: Math.sin(angle) * 500,
                damage: GameData.player.weapon.damage,
                range: GameData.player.weapon.range,
                traveled: 0,
                fromPlayer: true
            });
        }
    }

    switchWeapon(type) {
        if (WEAPONS[type]) {
            const found = GameData.player.inventory.find(item =>
                item.type === 'weapon' && item.weapon.name === WEAPONS[type].name);
            if (found) {
                GameData.player.weapon = found.weapon;
                GameData.player.reloading = false;
            }
        }
    }

    interactWithLoot() {
        for (const container of GameData.lootContainers) {
            if (container.opened) continue;

            const dist = Phaser.Math.Distance.Between(
                GameData.player.x, GameData.player.y, container.x, container.y);
            if (dist < 40) {
                container.opened = true;

                for (const item of container.items) {
                    if (item === 'medkit') {
                        GameData.player.hp = Math.min(GameData.player.maxHp, GameData.player.hp + 50);
                        GameData.player.bleeding = 0;
                        GameData.score += 100;
                    } else if (item === 'bandage') {
                        GameData.player.hp = Math.min(GameData.player.maxHp, GameData.player.hp + 20);
                        GameData.player.bleeding = Math.max(0, GameData.player.bleeding - 1);
                        GameData.score += 50;
                    } else if (item === 'ammo') {
                        GameData.player.weapon.currentAmmo = GameData.player.weapon.magSize;
                        GameData.score += 30;
                    } else if (item.startsWith('weapon_')) {
                        const wType = item.replace('weapon_', '');
                        if (WEAPONS[wType]) {
                            GameData.player.inventory.push({
                                type: 'weapon',
                                weapon: { ...WEAPONS[wType], currentAmmo: WEAPONS[wType].magSize }
                            });
                            GameData.score += 200;
                        }
                    }
                }

                GameData.lootCollected++;
                break;
            }
        }
    }

    updateEnemies(dt) {
        for (const enemy of GameData.enemies) {
            if (enemy.hp <= 0) continue;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, GameData.player.x, GameData.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(
                enemy.x, enemy.y, GameData.player.x, GameData.player.y);

            const angleDiff = Phaser.Math.Angle.Wrap(angleToPlayer - enemy.angle);
            const canSeePlayer = dist < enemy.aggro && Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;

            if (canSeePlayer) {
                enemy.state = 'alert';
                enemy.alertTimer = 3;
                enemy.angle = angleToPlayer;

                if (enemy.behavior === 'melee' || enemy.behavior === 'charge') {
                    if (dist > 30) {
                        enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
                        enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
                    } else {
                        GameData.player.hp -= enemy.damage * dt;
                        if (Math.random() < 0.3 * dt) GameData.player.bleeding += 0.5;
                    }
                } else if (enemy.behavior === 'ranged') {
                    if (dist > 150) {
                        enemy.x += Math.cos(angleToPlayer) * enemy.speed * dt;
                        enemy.y += Math.sin(angleToPlayer) * enemy.speed * dt;
                    } else if (dist < 80) {
                        enemy.x -= Math.cos(angleToPlayer) * enemy.speed * dt;
                        enemy.y -= Math.sin(angleToPlayer) * enemy.speed * dt;
                    }

                    if (this.time.now - enemy.lastFire >= enemy.fireRate) {
                        this.enemyFire(enemy);
                        enemy.lastFire = this.time.now;
                    }
                }
            } else if (enemy.alertTimer > 0) {
                enemy.alertTimer -= dt;
                enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.5 * dt;
                enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.5 * dt;
            } else {
                enemy.state = 'idle';
                if (Math.random() < 0.01) {
                    enemy.angle = Math.random() * Math.PI * 2;
                }
                enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3 * dt;
                enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3 * dt;
            }

            enemy.x = Phaser.Math.Clamp(enemy.x, TILE_SIZE, (MAP_WIDTH - 1) * TILE_SIZE);
            enemy.y = Phaser.Math.Clamp(enemy.y, TILE_SIZE, (MAP_HEIGHT - 1) * TILE_SIZE);
        }
    }

    enemyFire(enemy) {
        const angle = enemy.angle + (Math.random() - 0.5) * 0.3;
        GameData.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            damage: enemy.damage,
            range: 200,
            traveled: 0,
            fromPlayer: false
        });
    }

    updateBullets() {
        const dt = this.game.loop.delta / 1000;

        for (let i = GameData.bullets.length - 1; i >= 0; i--) {
            const bullet = GameData.bullets[i];

            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;

            if (bullet.traveled > bullet.range) {
                GameData.bullets.splice(i, 1);
                continue;
            }

            const tileX = Math.floor(bullet.x / TILE_SIZE);
            const tileY = Math.floor(bullet.y / TILE_SIZE);
            if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT ||
                !GameData.map[tileY][tileX].walkable) {
                GameData.bullets.splice(i, 1);
                continue;
            }

            if (bullet.fromPlayer) {
                for (const enemy of GameData.enemies) {
                    if (enemy.hp <= 0) continue;
                    if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < 15) {
                        enemy.hp -= bullet.damage;

                        GameData.bloodSplatters.push({
                            x: bullet.x, y: bullet.y,
                            size: 5 + Math.random() * 10
                        });

                        if (enemy.hp <= 0) {
                            GameData.kills++;
                            GameData.score += 150;
                            for (let j = 0; j < 5; j++) {
                                GameData.bloodSplatters.push({
                                    x: enemy.x + (Math.random() - 0.5) * 20,
                                    y: enemy.y + (Math.random() - 0.5) * 20,
                                    size: 8 + Math.random() * 15
                                });
                            }
                        }

                        GameData.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y,
                    GameData.player.x, GameData.player.y) < 12) {
                    GameData.player.hp -= bullet.damage;
                    if (Math.random() < 0.4) GameData.player.bleeding += 1;

                    GameData.bloodSplatters.push({
                        x: bullet.x, y: bullet.y,
                        size: 5 + Math.random() * 8
                    });

                    GameData.bullets.splice(i, 1);
                }
            }
        }
    }

    checkExtraction(dt) {
        const dist = Phaser.Math.Distance.Between(
            GameData.player.x, GameData.player.y,
            GameData.extractionPoint.x + TILE_SIZE / 2,
            GameData.extractionPoint.y + TILE_SIZE / 2);

        if (dist < GameData.extractionPoint.radius) {
            GameData.extractionPoint.extracting = true;
            GameData.extractionPoint.timer += dt;

            if (GameData.extractionPoint.timer >= 3) {
                GameData.score += 500;
                this.scene.start('ExtractedScene');
            }
        } else {
            GameData.extractionPoint.extracting = false;
            GameData.extractionPoint.timer = 0;
        }
    }

    render() {
        this.mapGraphics.clear();
        this.bloodGraphics.clear();
        this.unitGraphics.clear();
        this.bulletGraphics.clear();
        this.uiGraphics.clear();

        this.renderMap();
        this.renderBlood();
        this.renderLoot();
        this.renderExtraction();
        this.renderEnemies();
        this.renderPlayer();
        this.renderBullets();
        if (GameData.showDebug) this.renderDebug();
    }

    renderMap() {
        const cam = this.cameras.main;
        const startX = Math.floor(cam.worldView.x / TILE_SIZE);
        const startY = Math.floor(cam.worldView.y / TILE_SIZE);
        const endX = Math.min(MAP_WIDTH, startX + Math.ceil(cam.width / TILE_SIZE) + 2);
        const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(cam.height / TILE_SIZE) + 2);

        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = GameData.map[y][x];
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;

                const tileCenter = { x: screenX + TILE_SIZE / 2, y: screenY + TILE_SIZE / 2 };
                const dist = Phaser.Math.Distance.Between(
                    GameData.player.x, GameData.player.y, tileCenter.x, tileCenter.y);
                const angleToTile = Phaser.Math.Angle.Between(
                    GameData.player.x, GameData.player.y, tileCenter.x, tileCenter.y);
                const angleDiff = Phaser.Math.Angle.Wrap(angleToTile - GameData.player.angle);
                const inVisionCone = Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;
                const inRange = dist < VIEW_RANGE;

                let visibility = 0;
                if (inRange) {
                    visibility = inVisionCone ? 1 - (dist / VIEW_RANGE) * 0.3 : 0.3 - (dist / VIEW_RANGE) * 0.2;
                }

                this.mapGraphics.fillStyle(tile.color);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                if (tile.type === 'tree') {
                    this.mapGraphics.fillStyle(0x0a2a0a);
                    this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12);
                }

                if (tile.type === 'bush') {
                    this.mapGraphics.fillStyle(0x4a6a4a);
                    this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 8);
                }

                if (visibility < 1) {
                    this.mapGraphics.fillStyle(0x0a0a14, 1 - visibility);
                    this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    renderBlood() {
        for (const blood of GameData.bloodSplatters) {
            this.bloodGraphics.fillStyle(0x882222);
            this.bloodGraphics.fillCircle(blood.x, blood.y, blood.size);
        }
    }

    renderLoot() {
        for (const container of GameData.lootContainers) {
            if (!this.isVisible(container.x, container.y)) continue;

            this.unitGraphics.fillStyle(container.opened ? 0x3a3a3a : 0x8a6a4a);
            this.unitGraphics.fillRect(container.x - 10, container.y - 10, 20, 20);

            if (!container.opened) {
                this.unitGraphics.lineStyle(2, 0xaa8a5a);
                this.unitGraphics.strokeRect(container.x - 10, container.y - 10, 20, 20);
            }
        }
    }

    renderExtraction() {
        const ex = GameData.extractionPoint.x + TILE_SIZE / 2;
        const ey = GameData.extractionPoint.y + TILE_SIZE / 2;

        const pulse = Math.sin(this.time.now / 200) * 0.3 + 0.7;
        this.unitGraphics.lineStyle(3, 0x44ff44, pulse);
        this.unitGraphics.strokeCircle(ex, ey, GameData.extractionPoint.radius);

        if (GameData.extractionPoint.extracting) {
            const progress = GameData.extractionPoint.timer / 3;
            this.unitGraphics.fillStyle(0x44ff44);
            this.unitGraphics.fillRect(ex - 25, ey - 50, 50 * progress, 8);
            this.unitGraphics.lineStyle(1, 0xffffff);
            this.unitGraphics.strokeRect(ex - 25, ey - 50, 50, 8);
        }
    }

    renderEnemies() {
        for (const enemy of GameData.enemies) {
            if (enemy.hp <= 0) continue;
            if (!this.isVisible(enemy.x, enemy.y)) continue;

            this.unitGraphics.fillStyle(enemy.color);
            this.unitGraphics.fillCircle(enemy.x, enemy.y, 12);

            this.unitGraphics.lineStyle(2, 0xffffff);
            this.unitGraphics.beginPath();
            this.unitGraphics.moveTo(enemy.x, enemy.y);
            this.unitGraphics.lineTo(
                enemy.x + Math.cos(enemy.angle) * 15,
                enemy.y + Math.sin(enemy.angle) * 15);
            this.unitGraphics.strokePath();

            const hpPercent = enemy.hp / enemy.maxHp;
            this.unitGraphics.fillStyle(0x222222);
            this.unitGraphics.fillRect(enemy.x - 15, enemy.y - 22, 30, 4);
            this.unitGraphics.fillStyle(hpPercent > 0.5 ? 0x44aa44 : (hpPercent > 0.25 ? 0xaaaa44 : 0xaa4444));
            this.unitGraphics.fillRect(enemy.x - 15, enemy.y - 22, 30 * hpPercent, 4);
        }
    }

    renderPlayer() {
        this.unitGraphics.fillStyle(0x4488cc);
        this.unitGraphics.fillCircle(GameData.player.x, GameData.player.y, 12);

        this.unitGraphics.lineStyle(3, 0xcccccc);
        this.unitGraphics.beginPath();
        this.unitGraphics.moveTo(GameData.player.x, GameData.player.y);
        this.unitGraphics.lineTo(
            GameData.player.x + Math.cos(GameData.player.angle) * 20,
            GameData.player.y + Math.sin(GameData.player.angle) * 20);
        this.unitGraphics.strokePath();

        // Vision cone
        this.unitGraphics.fillStyle(0xffff88, 0.05);
        this.unitGraphics.slice(
            GameData.player.x, GameData.player.y, VIEW_RANGE,
            GameData.player.angle - VISION_CONE_ANGLE / 2,
            GameData.player.angle + VISION_CONE_ANGLE / 2);
        this.unitGraphics.fillPath();
    }

    renderBullets() {
        for (const bullet of GameData.bullets) {
            this.bulletGraphics.fillStyle(bullet.fromPlayer ? 0xffff44 : 0xff4444);
            this.bulletGraphics.fillCircle(bullet.x, bullet.y, 3);

            this.bulletGraphics.lineStyle(1, bullet.fromPlayer ? 0xffff44 : 0xff4444, 0.5);
            this.bulletGraphics.beginPath();
            this.bulletGraphics.moveTo(bullet.x, bullet.y);
            this.bulletGraphics.lineTo(
                bullet.x - bullet.vx * 0.02,
                bullet.y - bullet.vy * 0.02);
            this.bulletGraphics.strokePath();
        }
    }

    renderDebug() {
        this.uiGraphics.fillStyle(0x000000, 0.8);
        this.uiGraphics.fillRect(5, 105, 200, 180);

        const p = GameData.player;
        const lines = [
            'DEBUG OVERLAY',
            `Player: ${Math.floor(p.x)}, ${Math.floor(p.y)}`,
            `Angle: ${(p.angle * 180 / Math.PI).toFixed(1)}°`,
            `HP: ${p.hp.toFixed(1)} Bleed: ${p.bleeding.toFixed(2)}`,
            `Stamina: ${p.stamina.toFixed(1)}`,
            `Weapon: ${p.weapon.name}`,
            `Enemies: ${GameData.enemies.filter(e => e.hp > 0).length}`,
            `Bullets: ${GameData.bullets.length}`,
            `Loot: ${GameData.lootContainers.filter(c => !c.opened).length}`,
            `Game Time: ${GameData.gameTime.toFixed(1)}s`,
            `Score: ${GameData.score}`
        ];

        for (let i = 0; i < this.debugTexts.length && i < lines.length; i++) {
            this.debugTexts[i].setText(lines[i]);
            this.debugTexts[i].setVisible(true);
        }
    }

    updateUI() {
        // HP bar (drawn manually)
        this.uiGraphics.fillStyle(0x222222);
        this.uiGraphics.fillRect(10, 10, 150, 20);
        const hpPercent = GameData.player.hp / GameData.player.maxHp;
        this.uiGraphics.fillStyle(hpPercent > 0.5 ? 0xcc4444 : (hpPercent > 0.25 ? 0xaaaa44 : 0xaa4444));
        this.uiGraphics.fillRect(10, 10, 150 * hpPercent, 20);
        this.uiGraphics.lineStyle(1, 0xffffff);
        this.uiGraphics.strokeRect(10, 10, 150, 20);

        // Stamina bar
        this.uiGraphics.fillStyle(0x222222);
        this.uiGraphics.fillRect(10, 35, 150, 10);
        this.uiGraphics.fillStyle(0x44aa44);
        this.uiGraphics.fillRect(10, 35, 150 * (GameData.player.stamina / GameData.player.maxStamina), 10);

        this.hpText.setText(`HP: ${Math.ceil(GameData.player.hp)}/${GameData.player.maxHp}`);
        this.weaponText.setText(GameData.player.weapon.name);
        this.ammoText.setText(`${GameData.player.weapon.currentAmmo}/${GameData.player.weapon.magSize}` +
            (GameData.player.reloading ? ' RELOADING...' : ''));
        this.bleedText.setText(GameData.player.bleeding > 0 ? 'BLEEDING' : '');

        this.scoreText.setText(`Score: ${GameData.score}\nKills: ${GameData.kills}\nLoot: ${GameData.lootCollected}`);

        const extractDist = Math.floor(Phaser.Math.Distance.Between(
            GameData.player.x, GameData.player.y,
            GameData.extractionPoint.x + TILE_SIZE / 2,
            GameData.extractionPoint.y + TILE_SIZE / 2));
        this.extractText.setText(`Extract: ${extractDist}px SE`);

        // Hide debug texts if not showing
        if (!GameData.showDebug) {
            for (const dt of this.debugTexts) dt.setVisible(false);
        }
    }

    isVisible(x, y) {
        const dist = Phaser.Math.Distance.Between(GameData.player.x, GameData.player.y, x, y);
        if (dist > VIEW_RANGE) return false;
        const angleToTarget = Phaser.Math.Angle.Between(GameData.player.x, GameData.player.y, x, y);
        const angleDiff = Phaser.Math.Angle.Wrap(angleToTarget - GameData.player.angle);
        return Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        this.cameras.main.setBackgroundColor(0x0a0a1a);

        this.add.text(400, 180, 'YOU DIED', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 260, `Final Score: ${GameData.score}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 290, `Kills: ${GameData.kills}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Loot: ${GameData.lootCollected}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 350, `Survived: ${GameData.gameTime.toFixed(1)}s`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 430, 'Press R to Restart', {
            fontSize: '16px', fontFamily: 'Courier New', color: '#aabbcc'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => this.scene.start('MenuScene'));
    }
}

// Extracted Scene
class ExtractedScene extends Phaser.Scene {
    constructor() { super('ExtractedScene'); }

    create() {
        this.cameras.main.setBackgroundColor(0x003300);

        this.add.text(400, 180, 'EXTRACTED!', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#44ff44', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 260, `Final Score: ${GameData.score}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 290, `Kills: ${GameData.kills}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Loot: ${GameData.lootCollected}`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 350, `Raid Time: ${GameData.gameTime.toFixed(1)}s`, {
            fontSize: '18px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(400, 430, 'Press R to Start New Raid', {
            fontSize: '16px', fontFamily: 'Courier New', color: '#aabbcc'
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
    scene: [BootScene, MenuScene, GameScene, GameOverScene, ExtractedScene]
};

// Start game
const game = new Phaser.Game(config);
