// Derelict - Survival Horror with Vision Cone
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Enemy data
const ENEMIES = {
    crawler: { hp: 30, damage: 15, speed: 80, size: 24, color: 0x448844 },
    shambler: { hp: 60, damage: 25, speed: 50, size: 28, color: 0x664444 },
    stalker: { hp: 45, damage: 20, speed: 150, size: 24, color: 0x444466 },
    boss: { hp: 150, damage: 35, speed: 80, size: 48, color: 0x884488 }
};

// Weapons data
const WEAPONS = {
    pipe: { damage: 20, rate: 600, type: 'melee', ammo: Infinity },
    pistol: { damage: 25, rate: 500, type: 'ranged', ammo: 12, maxAmmo: 60 },
    shotgun: { damage: 40, rate: 1000, type: 'ranged', ammo: 6, maxAmmo: 30 },
    smg: { damage: 15, rate: 200, type: 'ranged', ammo: 30, maxAmmo: 90 }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const g = this.make.graphics({ add: false });

        // Player
        g.clear();
        g.fillStyle(0x4488ff);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0xffffff);
        g.fillTriangle(16, 4, 28, 20, 16, 16);
        g.generateTexture('player', 32, 32);

        // Escape pod
        g.clear();
        g.fillStyle(0x888888);
        g.fillRoundedRect(0, 0, 40, 40, 8);
        g.fillStyle(0x66aaff);
        g.fillCircle(20, 20, 12);
        g.generateTexture('escapePod', 40, 40);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 3);
        g.generateTexture('bullet', 8, 8);

        // Melee swing
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(0, 8, 32, 4);
        g.generateTexture('swing', 32, 20);

        // Wall tile
        g.clear();
        g.fillStyle(0x3a3a4a);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2a3a);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Floor tile
        g.clear();
        g.fillStyle(0x252530);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x1a1a20);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(0x555566);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x666677);
        g.fillRect(4, 8, 24, 16);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Pickups
        const pickups = [
            { name: 'o2Small', color: 0x00aaff, size: 12 },
            { name: 'o2Large', color: 0x0088ff, size: 16 },
            { name: 'medkitSmall', color: 0xff4444, size: 12 },
            { name: 'medkitLarge', color: 0xff0000, size: 16 },
            { name: 'ammo', color: 0xffaa00, size: 10 }
        ];
        pickups.forEach(p => {
            g.clear();
            g.fillStyle(p.color);
            g.fillCircle(p.size, p.size, p.size - 2);
            g.generateTexture(p.name, p.size * 2, p.size * 2);
        });

        // Enemy textures
        Object.entries(ENEMIES).forEach(([name, data]) => {
            g.clear();
            g.fillStyle(data.color);
            g.fillCircle(data.size / 2, data.size / 2, data.size / 2 - 2);
            g.fillStyle(0xff0000);
            g.fillCircle(data.size / 3, data.size / 3, 3);
            g.fillCircle(data.size * 2 / 3, data.size / 3, 3);
            g.generateTexture(`enemy_${name}`, data.size, data.size);
        });

        // Derelict ship (for space mode)
        g.clear();
        g.fillStyle(0x444455);
        g.fillRect(10, 0, 80, 50);
        g.fillStyle(0x555566);
        g.fillRect(0, 15, 100, 20);
        g.generateTexture('derelictShip', 100, 50);

        // Player ship (escape pod in space)
        g.clear();
        g.fillStyle(0x6688ff);
        g.fillTriangle(20, 0, 40, 30, 0, 30);
        g.generateTexture('playerShip', 40, 30);

        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2;

        this.add.text(cx, 100, 'DERELICT', {
            fontSize: '64px', fontFamily: 'Arial', color: '#446688', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 170, 'Survive the dying ships', {
            fontSize: '20px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, 250, 'WASD - Move | Mouse - Aim | Click - Attack', {
            fontSize: '16px', fontFamily: 'Arial', color: '#555555'
        }).setOrigin(0.5);

        this.add.text(cx, 280, 'Shift - Run | E - Interact | F - Flashlight', {
            fontSize: '16px', fontFamily: 'Arial', color: '#555555'
        }).setOrigin(0.5);

        this.add.text(cx, 340, '[ Manage your OXYGEN carefully ]', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00aaff'
        }).setOrigin(0.5);

        const start = this.add.text(cx, 450, '[ START ]', {
            fontSize: '32px', fontFamily: 'Arial', color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        start.on('pointerover', () => start.setColor('#88ffaa'));
        start.on('pointerout', () => start.setColor('#00ff88'));
        start.on('pointerdown', () => this.scene.start('GameScene', { shipIndex: 0 }));
    }
}

// Main Game Scene (In-Ship Mode)
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.shipIndex = data.shipIndex || 0;
    }

    create() {
        // Player state
        this.hp = 100;
        this.maxHp = 100;
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.currentWeapon = 'pipe';
        this.ammo = { pistol: 24, shotgun: 12, smg: 60 };
        this.weapons = ['pipe'];
        this.lastAttack = 0;
        this.flashlightOn = true;
        this.lastO2Drain = 0;
        this.isRunning = false;

        // Ship config
        const shipConfigs = [
            { name: 'Tutorial Ship', rooms: 5, enemies: [{ type: 'crawler', count: 3 }], weapon: 'pistol' },
            { name: 'Derelict 2', rooms: 7, enemies: [{ type: 'shambler', count: 3 }, { type: 'crawler', count: 2 }], weapon: 'shotgun' },
            { name: 'Final Ship', rooms: 9, enemies: [{ type: 'stalker', count: 3 }, { type: 'shambler', count: 3 }], weapon: 'smg', hasBoss: true }
        ];
        this.shipConfig = shipConfigs[this.shipIndex];

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        this.doors = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.meleeSwings = this.physics.add.group();

        // Generate ship
        this.generateShip();

        // Create player
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(12, 4, 4);
        this.player.setDepth(10);

        // Vision mask
        this.visionMask = this.add.graphics().setDepth(100);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.bullets, this.walls, b => b.destroy());
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.meleeSwings, this.enemies, this.meleeHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.doors, this.checkDoor, null, this);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            shift: 'SHIFT', interact: 'E', flashlight: 'F',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE', weapon4: 'FOUR'
        });

        this.input.on('pointerdown', () => this.attack());
        this.input.keyboard.on('keydown-F', () => this.flashlightOn = !this.flashlightOn);
        this.input.keyboard.on('keydown-ONE', () => this.switchWeapon(0));
        this.input.keyboard.on('keydown-TWO', () => this.switchWeapon(1));
        this.input.keyboard.on('keydown-THREE', () => this.switchWeapon(2));
        this.input.keyboard.on('keydown-FOUR', () => this.switchWeapon(3));

        // HUD
        this.createHUD();

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    generateShip() {
        const config = this.shipConfig;
        const roomWidth = 8;
        const roomHeight = 6;

        // Create linear ship layout
        const shipWidth = config.rooms * roomWidth * TILE_SIZE;
        const shipHeight = roomHeight * TILE_SIZE + 4 * TILE_SIZE;

        this.physics.world.setBounds(0, 0, shipWidth, shipHeight);
        this.cameras.main.setBounds(0, 0, shipWidth, shipHeight);

        // Generate rooms
        for (let r = 0; r < config.rooms; r++) {
            const rx = r * roomWidth * TILE_SIZE;
            const ry = 2 * TILE_SIZE;

            // Floor
            for (let y = 0; y < roomHeight; y++) {
                for (let x = 0; x < roomWidth; x++) {
                    this.floors.add(this.add.image(
                        rx + x * TILE_SIZE + TILE_SIZE / 2,
                        ry + y * TILE_SIZE + TILE_SIZE / 2,
                        'floor'
                    ).setDepth(0));
                }
            }

            // Walls (top and bottom)
            for (let x = 0; x < roomWidth; x++) {
                this.walls.create(rx + x * TILE_SIZE + TILE_SIZE / 2, ry - TILE_SIZE / 2, 'wall');
                this.walls.create(rx + x * TILE_SIZE + TILE_SIZE / 2, ry + roomHeight * TILE_SIZE + TILE_SIZE / 2, 'wall');
            }

            // Walls (left side, except for door)
            if (r > 0) {
                for (let y = 0; y < roomHeight; y++) {
                    if (y !== Math.floor(roomHeight / 2)) {
                        this.walls.create(rx + TILE_SIZE / 2, ry + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                    }
                }
            } else {
                for (let y = 0; y < roomHeight; y++) {
                    this.walls.create(rx + TILE_SIZE / 2, ry + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                }
            }

            // Walls (right side, except for door to next room)
            if (r < config.rooms - 1) {
                for (let y = 0; y < roomHeight; y++) {
                    if (y !== Math.floor(roomHeight / 2)) {
                        this.walls.create(rx + (roomWidth - 1) * TILE_SIZE + TILE_SIZE / 2, ry + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                    }
                }
            } else {
                for (let y = 0; y < roomHeight; y++) {
                    this.walls.create(rx + (roomWidth - 1) * TILE_SIZE + TILE_SIZE / 2, ry + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                }
            }

            // Add some obstacles in rooms
            if (r > 0 && r < config.rooms - 1) {
                const numObstacles = Phaser.Math.Between(1, 3);
                for (let i = 0; i < numObstacles; i++) {
                    const ox = rx + TILE_SIZE * 2 + Math.floor(Math.random() * (roomWidth - 4)) * TILE_SIZE;
                    const oy = ry + TILE_SIZE + Math.floor(Math.random() * (roomHeight - 2)) * TILE_SIZE;
                    this.walls.create(ox + TILE_SIZE / 2, oy + TILE_SIZE / 2, 'wall');
                }
            }

            // Add pickups
            if (r > 0) {
                const pickupTypes = ['o2Small', 'o2Small', 'medkitSmall', 'ammo'];
                if (Math.random() < 0.6) {
                    const px = rx + TILE_SIZE * 2 + Math.random() * (roomWidth - 4) * TILE_SIZE;
                    const py = ry + TILE_SIZE + Math.random() * (roomHeight - 2) * TILE_SIZE;
                    const ptype = Phaser.Utils.Array.GetRandom(pickupTypes);
                    const pickup = this.physics.add.sprite(px, py, ptype);
                    pickup.setData('type', ptype);
                    this.pickups.add(pickup);
                }
            }

            // Weapon pickup (specific room)
            if (r === Math.floor(config.rooms / 2) && config.weapon) {
                const wx = rx + roomWidth * TILE_SIZE / 2;
                const wy = ry + roomHeight * TILE_SIZE / 2;
                const weaponPickup = this.physics.add.sprite(wx, wy, 'ammo');
                weaponPickup.setData('type', 'weapon');
                weaponPickup.setData('weapon', config.weapon);
                weaponPickup.setTint(0x00ff00);
                this.pickups.add(weaponPickup);
            }
        }

        // Player spawn
        this.spawnX = TILE_SIZE * 3;
        this.spawnY = 2 * TILE_SIZE + (roomHeight / 2) * TILE_SIZE;

        // Exit door (last room)
        const exitX = (config.rooms - 1) * roomWidth * TILE_SIZE + (roomWidth - 2) * TILE_SIZE;
        const exitY = 2 * TILE_SIZE + Math.floor(roomHeight / 2) * TILE_SIZE;
        const exitDoor = this.physics.add.staticSprite(exitX + TILE_SIZE / 2, exitY + TILE_SIZE / 2, 'door');
        exitDoor.setData('type', 'exit');
        exitDoor.setTint(0x00ff88);
        this.doors.add(exitDoor);

        // Spawn enemies
        config.enemies.forEach(e => {
            for (let i = 0; i < e.count; i++) {
                const room = Phaser.Math.Between(1, config.rooms - 2);
                const rx = room * roomWidth * TILE_SIZE + TILE_SIZE * 2;
                const ex = rx + Math.random() * (roomWidth - 4) * TILE_SIZE;
                const ey = 2 * TILE_SIZE + TILE_SIZE + Math.random() * (roomHeight - 2) * TILE_SIZE;
                this.spawnEnemy(ex, ey, e.type);
            }
        });

        // Boss on final ship
        if (config.hasBoss) {
            const bossRoom = config.rooms - 2;
            const bx = bossRoom * roomWidth * TILE_SIZE + roomWidth * TILE_SIZE / 2;
            const by = 2 * TILE_SIZE + roomHeight * TILE_SIZE / 2;
            this.spawnEnemy(bx, by, 'boss');
        }
    }

    spawnEnemy(x, y, type) {
        const data = ENEMIES[type];
        const enemy = this.physics.add.sprite(x, y, `enemy_${type}`);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('damage', data.damage);
        enemy.setData('speed', data.speed);
        enemy.setData('lastAttack', 0);
        enemy.body.setCircle(data.size / 2 - 2);
        this.enemies.add(enemy);
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

        // Oxygen bar
        this.hudContainer.add(this.add.rectangle(120, 25, 204, 20, 0x333333).setScrollFactor(0));
        this.o2Bar = this.add.rectangle(20, 17, 200, 16, 0x00aaff).setOrigin(0, 0).setScrollFactor(0);
        this.hudContainer.add(this.o2Bar);
        this.hudContainer.add(this.add.text(120, 25, 'O2', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0));

        // HP bar
        this.hudContainer.add(this.add.rectangle(120, 50, 204, 20, 0x333333).setScrollFactor(0));
        this.hpBar = this.add.rectangle(20, 42, 200, 16, 0xff4444).setOrigin(0, 0).setScrollFactor(0);
        this.hudContainer.add(this.hpBar);
        this.hudContainer.add(this.add.text(120, 50, 'HP', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0));

        // Weapon
        this.weaponText = this.add.text(20, 560, '', { fontSize: '16px', color: '#88ccff' }).setScrollFactor(0);
        this.hudContainer.add(this.weaponText);

        // Ammo
        this.ammoText = this.add.text(20, 580, '', { fontSize: '14px', color: '#ffaa00' }).setScrollFactor(0);
        this.hudContainer.add(this.ammoText);

        // Ship name
        this.shipText = this.add.text(GAME_WIDTH / 2, 20, this.shipConfig.name, {
            fontSize: '18px', color: '#666666'
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this.hudContainer.add(this.shipText);

        // Warning text
        this.warningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '', {
            fontSize: '24px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.updateHUD();
    }

    updateHUD() {
        this.o2Bar.width = (this.oxygen / this.maxOxygen) * 200;
        this.hpBar.width = (this.hp / this.maxHp) * 200;

        this.weaponText.setText(`Weapon: ${this.currentWeapon.toUpperCase()}`);

        const weapon = WEAPONS[this.currentWeapon];
        if (weapon.type === 'ranged') {
            this.ammoText.setText(`Ammo: ${this.ammo[this.currentWeapon]}/${weapon.maxAmmo}`);
        } else {
            this.ammoText.setText('Melee');
        }

        // Low oxygen warning
        if (this.oxygen < 20) {
            this.warningText.setText('LOW OXYGEN!');
        } else {
            this.warningText.setText('');
        }
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // Oxygen drain
        this.isRunning = this.cursors.shift.isDown;
        const drainInterval = this.isRunning ? 750 : (this.player.body.velocity.length() > 10 ? 1500 : 2000);

        if (time - this.lastO2Drain > drainInterval) {
            this.lastO2Drain = time;
            this.oxygen = Math.max(0, this.oxygen - 1);

            if (this.oxygen <= 0) {
                this.die('suffocation');
            }
        }

        // Movement
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        const speed = this.isRunning ? 200 : 120;
        this.player.setVelocity(vx * speed, vy * speed);

        // Player rotation (aim at mouse)
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.setRotation(angle);

        // Update enemies
        this.updateEnemies(time);

        // Update vision
        this.updateVision();

        // Update HUD
        this.updateHUD();
    }

    updateEnemies(time) {
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const speed = enemy.getData('speed');
            const type = enemy.getData('type');

            // Simple chase behavior
            if (dist < 300 && dist > 30) {
                this.physics.moveToObject(enemy, this.player, speed);
            } else if (dist <= 30) {
                enemy.setVelocity(0, 0);
            } else {
                // Wander
                if (Math.random() < 0.01) {
                    const wanderAngle = Math.random() * Math.PI * 2;
                    enemy.setVelocity(Math.cos(wanderAngle) * speed * 0.3, Math.sin(wanderAngle) * speed * 0.3);
                }
            }

            // Boss special behavior
            if (type === 'boss') {
                const hp = enemy.getData('hp');
                const maxHp = ENEMIES.boss.hp;
                if (hp < maxHp * 0.5 && !enemy.getData('spawnedMinions')) {
                    enemy.setData('spawnedMinions', true);
                    // Spawn crawlers
                    for (let i = 0; i < 2; i++) {
                        this.spawnEnemy(enemy.x + (Math.random() - 0.5) * 50, enemy.y + (Math.random() - 0.5) * 50, 'crawler');
                    }
                }
            }
        });
    }

    updateVision() {
        this.visionMask.clear();

        if (!this.flashlightOn) {
            // Complete darkness except small area around player
            this.visionMask.fillStyle(0x000000, 0.9);
            this.visionMask.fillRect(
                this.cameras.main.scrollX - 100,
                this.cameras.main.scrollY - 100,
                GAME_WIDTH + 200,
                GAME_HEIGHT + 200
            );

            // Small circle around player
            this.visionMask.fillStyle(0x000000, 0);
            this.visionMask.setBlendMode(Phaser.BlendModes.ERASE);
            this.visionMask.fillCircle(this.player.x, this.player.y, 50);
            this.visionMask.setBlendMode(Phaser.BlendModes.NORMAL);
            return;
        }

        const px = this.player.x;
        const py = this.player.y;
        const facing = this.player.rotation;
        const coneAngle = Math.PI / 2; // 90 degrees
        const coneRange = 300;

        // Draw darkness
        this.visionMask.fillStyle(0x000000, 0.85);
        this.visionMask.fillRect(
            this.cameras.main.scrollX - 100,
            this.cameras.main.scrollY - 100,
            GAME_WIDTH + 200,
            GAME_HEIGHT + 200
        );

        // Cut out vision cone
        this.visionMask.setBlendMode(Phaser.BlendModes.ERASE);

        // Draw cone as triangle fan
        const segments = 30;
        const halfAngle = coneAngle / 2;

        this.visionMask.beginPath();
        this.visionMask.moveTo(px, py);

        for (let i = 0; i <= segments; i++) {
            const a = facing - halfAngle + (coneAngle * i / segments);
            const dist = this.raycast(px, py, a, coneRange);
            this.visionMask.lineTo(px + Math.cos(a) * dist, py + Math.sin(a) * dist);
        }

        this.visionMask.closePath();
        this.visionMask.fillPath();

        // Small ambient circle around player
        this.visionMask.fillCircle(px, py, 40);

        this.visionMask.setBlendMode(Phaser.BlendModes.NORMAL);

        // Update enemy visibility based on vision cone
        this.enemies.children.each(enemy => {
            const ex = enemy.x;
            const ey = enemy.y;
            const angleToEnemy = Phaser.Math.Angle.Between(px, py, ex, ey);
            const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - facing);
            const dist = Phaser.Math.Distance.Between(px, py, ex, ey);

            if (Math.abs(angleDiff) < halfAngle && dist < coneRange) {
                enemy.setVisible(true);
            } else if (dist < 40) {
                enemy.setVisible(true);
            } else {
                enemy.setVisible(false);
            }
        });
    }

    raycast(x, y, angle, maxDist) {
        const step = 8;
        for (let d = 0; d < maxDist; d += step) {
            const checkX = x + Math.cos(angle) * d;
            const checkY = y + Math.sin(angle) * d;

            // Check wall collision
            let hitWall = false;
            this.walls.children.each(wall => {
                if (hitWall) return;
                const wx = wall.x;
                const wy = wall.y;
                if (Math.abs(checkX - wx) < TILE_SIZE / 2 && Math.abs(checkY - wy) < TILE_SIZE / 2) {
                    hitWall = true;
                }
            });

            if (hitWall) return d;
        }
        return maxDist;
    }

    attack() {
        const weapon = WEAPONS[this.currentWeapon];
        const time = this.time.now;

        if (time - this.lastAttack < weapon.rate) return;

        // Check ammo for ranged
        if (weapon.type === 'ranged') {
            if (this.ammo[this.currentWeapon] <= 0) {
                this.showMessage('No ammo!');
                return;
            }
            this.ammo[this.currentWeapon]--;
        }

        this.lastAttack = time;

        // O2 cost for combat
        this.oxygen = Math.max(0, this.oxygen - 2);

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        if (weapon.type === 'melee') {
            // Melee swing
            const swing = this.physics.add.sprite(
                this.player.x + Math.cos(angle) * 25,
                this.player.y + Math.sin(angle) * 25,
                'swing'
            );
            swing.setRotation(angle);
            swing.setData('damage', weapon.damage);
            swing.setData('hit', new Set());
            this.meleeSwings.add(swing);

            this.time.delayedCall(150, () => swing.destroy());
        } else {
            // Ranged shot
            if (this.currentWeapon === 'shotgun') {
                // Multiple pellets
                for (let i = -2; i <= 2; i++) {
                    const a = angle + i * 0.1;
                    this.fireBullet(a, weapon.damage);
                }
            } else {
                this.fireBullet(angle, weapon.damage);
            }
        }
    }

    fireBullet(angle, damage) {
        const bullet = this.physics.add.sprite(this.player.x, this.player.y, 'bullet');
        bullet.setData('damage', damage);
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        this.bullets.add(bullet);

        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        this.damageEnemy(enemy, damage);
        bullet.destroy();
    }

    meleeHitEnemy(swing, enemy) {
        const hitSet = swing.getData('hit');
        if (hitSet.has(enemy)) return;
        hitSet.add(enemy);

        const damage = swing.getData('damage');
        this.damageEnemy(enemy, damage);
    }

    damageEnemy(enemy, damage) {
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyDeath(enemy) {
        const type = enemy.getData('type');

        // Drop pickup
        if (Math.random() < 0.4 || type === 'boss') {
            const dropTypes = ['o2Small', 'o2Small', 'medkitSmall', 'ammo'];
            const ptype = Phaser.Utils.Array.GetRandom(dropTypes);
            const pickup = this.physics.add.sprite(enemy.x, enemy.y, ptype);
            pickup.setData('type', ptype);
            this.pickups.add(pickup);
        }

        enemy.destroy();
    }

    playerHitEnemy(player, enemy) {
        const time = this.time.now;
        const lastAttack = enemy.getData('lastAttack');

        if (time - lastAttack < 1000) return;
        enemy.setData('lastAttack', time);

        const damage = enemy.getData('damage');
        this.hp -= damage;

        this.cameras.main.shake(100, 0.01);

        if (this.hp <= 0) {
            this.die('killed');
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        if (type === 'o2Small') {
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + 25);
            this.showMessage('+25 O2');
        } else if (type === 'o2Large') {
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + 50);
            this.showMessage('+50 O2');
        } else if (type === 'medkitSmall') {
            this.hp = Math.min(this.maxHp, this.hp + 30);
            this.showMessage('+30 HP');
        } else if (type === 'medkitLarge') {
            this.hp = Math.min(this.maxHp, this.hp + 60);
            this.showMessage('+60 HP');
        } else if (type === 'ammo') {
            Object.keys(this.ammo).forEach(w => {
                this.ammo[w] = Math.min(WEAPONS[w].maxAmmo, this.ammo[w] + 15);
            });
            this.showMessage('+Ammo');
        } else if (type === 'weapon') {
            const weapon = pickup.getData('weapon');
            if (!this.weapons.includes(weapon)) {
                this.weapons.push(weapon);
                this.currentWeapon = weapon;
                this.showMessage(`Got ${weapon.toUpperCase()}!`);
            }
        }

        pickup.destroy();
    }

    checkDoor(player, door) {
        if (!Phaser.Input.Keyboard.JustDown(this.cursors.interact)) return;

        const type = door.getData('type');
        if (type === 'exit') {
            // Go to space mode
            this.scene.start('SpaceScene', {
                shipIndex: this.shipIndex,
                hp: this.hp,
                oxygen: this.oxygen,
                weapons: this.weapons,
                ammo: this.ammo
            });
        }
    }

    switchWeapon(index) {
        if (index < this.weapons.length) {
            this.currentWeapon = this.weapons[index];
        }
    }

    showMessage(text) {
        const msg = this.add.text(this.player.x, this.player.y - 30, text, {
            fontSize: '16px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: msg,
            y: msg.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
    }

    die(cause) {
        this.player.setActive(false);
        this.player.setVisible(false);

        const messages = {
            suffocation: 'You ran out of oxygen...',
            killed: 'The creatures got you...'
        };

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', {
            fontSize: '48px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, messages[cause], {
            fontSize: '20px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
}

// Space Scene (Between Ships)
class SpaceScene extends Phaser.Scene {
    constructor() { super('SpaceScene'); }

    init(data) {
        this.shipIndex = data.shipIndex || 0;
        this.hp = data.hp || 100;
        this.oxygen = data.oxygen || 100;
        this.weapons = data.weapons || ['pipe'];
        this.ammo = data.ammo || { pistol: 24, shotgun: 12, smg: 60 };
    }

    create() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1a);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const size = Math.random() * 2 + 1;
            this.add.circle(x, y, size, 0xffffff, Math.random() * 0.5 + 0.5);
        }

        // Ships
        this.ships = [];
        const shipPositions = [
            { x: 150, y: 300, name: 'Tutorial Ship', visited: this.shipIndex > 0 },
            { x: 400, y: 200, name: 'Derelict 2', visited: this.shipIndex > 1, locked: this.shipIndex < 1 },
            { x: 650, y: 350, name: 'Final Ship', visited: false, locked: this.shipIndex < 2, isFinal: true }
        ];

        shipPositions.forEach((pos, i) => {
            const ship = this.add.sprite(pos.x, pos.y, 'derelictShip').setInteractive();
            ship.setData('index', i);
            ship.setData('name', pos.name);
            ship.setData('locked', pos.locked);

            if (pos.locked) {
                ship.setTint(0x444444);
            } else if (pos.visited) {
                ship.setTint(0x888888);
            }

            const label = this.add.text(pos.x, pos.y + 40, pos.name, {
                fontSize: '14px', color: pos.locked ? '#666666' : '#ffffff'
            }).setOrigin(0.5);

            ship.on('pointerover', () => {
                if (!pos.locked) ship.setScale(1.1);
            });
            ship.on('pointerout', () => ship.setScale(1));
            ship.on('pointerdown', () => {
                if (!pos.locked) {
                    this.enterShip(i);
                }
            });

            this.ships.push(ship);
        });

        // Player ship
        this.playerShip = this.add.sprite(
            shipPositions[this.shipIndex].x - 80,
            shipPositions[this.shipIndex].y,
            'playerShip'
        );

        // HUD
        this.add.text(20, 20, `O2: ${Math.ceil(this.oxygen)}`, {
            fontSize: '18px', color: '#00aaff'
        });
        this.add.text(20, 45, `HP: ${Math.ceil(this.hp)}`, {
            fontSize: '18px', color: '#ff4444'
        });

        this.add.text(GAME_WIDTH / 2, 30, 'SPACE - Select a ship to explore', {
            fontSize: '20px', color: '#888888'
        }).setOrigin(0.5);

        // If escaped final ship
        if (this.shipIndex >= 2) {
            this.victory();
        }
    }

    enterShip(index) {
        this.scene.start('GameScene', {
            shipIndex: index,
            hp: this.hp,
            oxygen: this.oxygen,
            weapons: this.weapons,
            ammo: this.ammo
        });
    }

    victory() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setDepth(100);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'ESCAPED!', {
            fontSize: '64px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'You survived the derelict ships!', {
            fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(101);

        const restart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '[ PLAY AGAIN ]', {
            fontSize: '24px', color: '#88ccff'
        }).setOrigin(0.5).setDepth(101).setInteractive();

        restart.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, SpaceScene]
};

const game = new Phaser.Game(config);
