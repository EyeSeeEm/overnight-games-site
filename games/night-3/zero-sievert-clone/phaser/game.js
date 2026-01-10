// Zero Sievert Clone - Phaser 3 Version
// Extraction shooter with procedural textures

const TILE = 48;
const MAP_W = 80, MAP_H = 60;

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.add.text(cx, cy - 130, 'RAD ZONE', { fontFamily: 'monospace', fontSize: '60px', color: '#4f4', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(cx, cy - 80, 'An Extraction Shooter', { fontFamily: 'monospace', fontSize: '24px', color: '#888' }).setOrigin(0.5);
        this.add.text(cx, cy - 20, 'WASD - Move    Shift - Sprint', { fontFamily: 'monospace', fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(cx, cy + 10, 'Mouse - Aim    Click - Shoot', { fontFamily: 'monospace', fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(cx, cy + 40, 'R - Reload    E - Loot    F - Heal', { fontFamily: 'monospace', fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(cx, cy + 100, 'Reach the EXTRACTION zone!', { fontFamily: 'monospace', fontSize: '18px', color: '#c33' }).setOrigin(0.5);
        this.add.text(cx, cy + 170, 'Press SPACE to Start', { fontFamily: 'monospace', fontSize: '28px', color: '#4f4', fontStyle: 'bold' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.createTextures();
        this.map = [];
        this.generateMap();

        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.lootItems = this.physics.add.group();

        // Player
        this.player = this.physics.add.sprite(10 * TILE, 10 * TILE, 'player');
        this.player.hp = 100; this.player.maxHp = 100;
        this.player.stam = 100; this.player.maxStam = 100;
        this.player.ammo = 30; this.player.maxAmmo = 30;
        this.player.items = 0; this.player.bleeding = false;
        this.player.bleedTimer = 0; this.player.shootCD = 0;
        this.player.reloading = false; this.player.reloadTimer = 0;
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(30, 30);

        this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
        this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.spawnEnemies();
        this.spawnLoot();

        // Extraction zone
        this.extract = { x: (MAP_W - 8) * TILE, y: (MAP_H - 8) * TILE, r: 120 };
        this.extractGfx = this.add.graphics();

        // Rain
        this.rain = [];
        for (let i = 0; i < 400; i++) {
            this.rain.push({ x: Math.random() * this.cameras.main.width, y: Math.random() * this.cameras.main.height, s: 500 + Math.random() * 250, l: 15 + Math.random() * 20 });
        }
        this.rainGfx = this.add.graphics().setScrollFactor(0).setDepth(100);

        // HUD
        this.hudGfx = this.add.graphics().setScrollFactor(0).setDepth(101);
        this.hudText = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setScrollFactor(0).setDepth(102);

        // Input
        this.keys = this.input.keyboard.addKeys({
            w: 'W', s: 'S', a: 'A', d: 'D',
            shift: 'SHIFT', r: 'R', e: 'E', f: 'F'
        });
        this.input.on('pointerdown', () => this.shoot());

        // Blood stains
        this.bloodGfx = this.add.graphics().setDepth(5);
        this.bloodStains = [];
    }

    createTextures() {
        // Grass textures
        ['grass1', 'grass2'].forEach((name, idx) => {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(idx === 0 ? 0x2d4a28 : 0x345530);
            gfx.fillRect(0, 0, TILE, TILE);
            for (let i = 0; i < 20; i++) {
                gfx.fillStyle(Math.random() > 0.5 ? 0x3a5a32 : 0x254020);
                gfx.fillRect(Math.random() * TILE, Math.random() * TILE, 3, 3);
            }
            gfx.generateTexture(name, TILE, TILE);
        });

        // Dirt
        const dirt = this.make.graphics({ add: false });
        dirt.fillStyle(0x5a4535); dirt.fillRect(0, 0, TILE, TILE);
        for (let i = 0; i < 12; i++) {
            dirt.fillStyle(Math.random() > 0.5 ? 0x4a3a2a : 0x6a5545);
            dirt.fillRect(Math.random() * TILE, Math.random() * TILE, 5, 5);
        }
        dirt.generateTexture('dirt', TILE, TILE);

        // Tree
        const tree = this.make.graphics({ add: false });
        tree.fillStyle(0x3a2a1a); tree.fillRect(TILE/2 - 4, TILE * 1.5 - 20, 8, 20);
        [0x1a3a18, 0x2a4a25, 0x1a3015].forEach((col, i) => {
            tree.fillStyle(col);
            tree.beginPath();
            tree.moveTo(TILE/2, i * 15);
            tree.lineTo(TILE - 5 - i * 3, TILE * 1.5 - 25 - i * 8);
            tree.lineTo(5 + i * 3, TILE * 1.5 - 25 - i * 8);
            tree.closePath(); tree.fillPath();
        });
        tree.generateTexture('tree', TILE, TILE * 1.5);

        // Wall
        const wall = this.make.graphics({ add: false });
        wall.fillStyle(0x4a3830); wall.fillRect(0, 0, TILE, TILE);
        wall.lineStyle(1, 0x3a2820);
        for (let y = 8; y < TILE; y += 12) { wall.lineBetween(0, y, TILE, y); }
        wall.generateTexture('wall', TILE, TILE);

        // Floor
        const floor = this.make.graphics({ add: false });
        floor.fillStyle(0x3a3535); floor.fillRect(0, 0, TILE, TILE);
        floor.lineStyle(1, 0x2a2525);
        floor.strokeRect(0, 0, TILE/2, TILE/2); floor.strokeRect(TILE/2, TILE/2, TILE/2, TILE/2);
        floor.generateTexture('floor', TILE, TILE);

        // Door
        const door = this.make.graphics({ add: false });
        door.fillStyle(0x3a3535); door.fillRect(0, 0, TILE, TILE);
        door.fillStyle(0x5a4535); door.fillRect(8, 4, TILE - 16, TILE - 4);
        door.generateTexture('door', TILE, TILE);

        // Player
        const player = this.make.graphics({ add: false });
        player.fillStyle(0x3a5545); player.fillRect(8, 10, 24, 22);
        player.fillStyle(0xc4a080); player.fillRect(12, 2, 16, 14);
        player.fillStyle(0x2a3530); player.fillRect(10, 0, 20, 8);
        player.fillStyle(0x3a5545); player.fillRect(2, 14, 8, 14); player.fillRect(30, 14, 8, 14);
        player.fillStyle(0x2a2a2a); player.fillRect(32, 17, 24, 6);
        player.generateTexture('player', 56, 40);

        // Bandit
        const bandit = this.make.graphics({ add: false });
        bandit.fillStyle(0x5a4540); bandit.fillRect(8, 10, 24, 22);
        bandit.fillStyle(0xc4a080); bandit.fillRect(12, 2, 16, 14);
        bandit.fillStyle(0x8a3030); bandit.fillRect(10, 6, 20, 6);
        bandit.generateTexture('bandit', 40, 40);

        // Mutant
        const mutant = this.make.graphics({ add: false });
        mutant.fillStyle(0x4a6a50); mutant.fillRect(6, 8, 28, 26);
        mutant.fillStyle(0x5a7a5a); mutant.fillRect(10, 0, 20, 16);
        mutant.fillStyle(0xff4444); mutant.fillRect(14, 6, 4, 4); mutant.fillRect(22, 6, 4, 4);
        mutant.generateTexture('mutant', 40, 40);

        // Crate
        const crate = this.make.graphics({ add: false });
        crate.fillStyle(0x5a5040); crate.fillRect(4, 8, TILE - 8, TILE - 12);
        crate.lineStyle(2, 0x3a3020); crate.strokeRect(4, 8, TILE - 8, TILE - 12);
        crate.fillStyle(0x6a6a6a); crate.fillRect(6, 14, TILE - 12, 4); crate.fillRect(6, TILE - 14, TILE - 12, 4);
        crate.generateTexture('crate', TILE, TILE);

        // Bullet
        const bullet = this.make.graphics({ add: false });
        bullet.fillStyle(0xffe066); bullet.fillCircle(5, 5, 5);
        bullet.generateTexture('bullet', 10, 10);
    }

    generateMap() {
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                this.map[y * MAP_W + x] = Math.random() < 0.6 ? 'grass1' : 'grass2';
            }
        }

        // Dirt paths
        for (let p = 0; p < 8; p++) {
            let px = Math.floor(Math.random() * MAP_W), py = Math.floor(Math.random() * MAP_H);
            for (let i = 0; i < 70; i++) {
                if (px >= 0 && px < MAP_W && py >= 0 && py < MAP_H) {
                    this.map[py * MAP_W + px] = 'dirt';
                    px += Math.floor(Math.random() * 3) - 1;
                    py += Math.floor(Math.random() * 3) - 1;
                }
            }
        }

        // Trees
        for (let i = 0; i < 200; i++) {
            const x = Math.floor(Math.random() * MAP_W), y = Math.floor(Math.random() * MAP_H);
            if (x > 5 && x < MAP_W - 5 && y > 5 && y < MAP_H - 5 && (Math.abs(x - 10) > 6 || Math.abs(y - 10) > 6)) {
                this.map[y * MAP_W + x] = 'tree';
            }
        }

        // Buildings
        for (let b = 0; b < 12; b++) {
            const bx = 10 + Math.floor(Math.random() * (MAP_W - 22));
            const by = 10 + Math.floor(Math.random() * (MAP_H - 22));
            const bw = 4 + Math.floor(Math.random() * 4);
            const bh = 3 + Math.floor(Math.random() * 3);
            for (let y = 0; y < bh; y++) {
                for (let x = 0; x < bw; x++) {
                    const tx = bx + x, ty = by + y;
                    if (tx < MAP_W && ty < MAP_H) {
                        this.map[ty * MAP_W + tx] = (x === 0 || x === bw - 1 || y === 0 || y === bh - 1) ? 'wall' : 'floor';
                    }
                }
            }
            const dx = bx + Math.floor(bw / 2), dy = by + bh - 1;
            if (dx < MAP_W && dy < MAP_H) this.map[dy * MAP_W + dx] = 'door';
        }

        // Draw tiles
        this.treeSprites = [];
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                const tile = this.map[y * MAP_W + x];
                if (tile !== 'tree') {
                    this.add.image(x * TILE, y * TILE, tile).setOrigin(0).setDepth(0);
                } else {
                    this.add.image(x * TILE, y * TILE, 'grass1').setOrigin(0).setDepth(0);
                    const treeSprite = this.add.image(x * TILE, y * TILE - TILE * 0.5, 'tree').setOrigin(0).setDepth(10);
                    this.treeSprites.push({ sprite: treeSprite, x: x * TILE, y: y * TILE });
                }
            }
        }

        // Collision walls
        this.walls = this.physics.add.staticGroup();
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                const tile = this.map[y * MAP_W + x];
                if (tile === 'wall' || tile === 'tree') {
                    const w = this.walls.create(x * TILE + TILE/2, y * TILE + TILE/2, null);
                    w.body.setSize(TILE, TILE);
                    w.setVisible(false);
                }
            }
        }
    }

    spawnEnemies() {
        for (let i = 0; i < 15; i++) {
            let x, y;
            do {
                x = (10 + Math.random() * (MAP_W - 20)) * TILE;
                y = (10 + Math.random() * (MAP_H - 20)) * TILE;
            } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 500);
            this.createEnemy(x, y, 'bandit');
        }
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = (10 + Math.random() * (MAP_W - 20)) * TILE;
                y = (10 + Math.random() * (MAP_H - 20)) * TILE;
            } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 500);
            this.createEnemy(x, y, 'mutant');
        }
    }

    createEnemy(x, y, type) {
        const e = this.enemies.create(x, y, type);
        e.type = type;
        e.hp = type === 'bandit' ? 55 : 40;
        e.maxHp = e.hp;
        e.speed = type === 'bandit' ? 85 : 140;
        e.dmg = type === 'bandit' ? 18 : 25;
        e.range = type === 'bandit' ? 300 : 50;
        e.cd = 0;
        e.vision = 350;
        e.alert = false;
        e.patrolTimer = Math.random() * 3;
        e.patrolAngle = Math.random() * Math.PI * 2;
        e.body.setSize(30, 30);
        e.setDepth(15);
    }

    spawnLoot() {
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                if (this.map[y * MAP_W + x] === 'floor' && Math.random() < 0.15) {
                    this.createLoot(x * TILE + TILE/2, y * TILE + TILE/2);
                }
            }
        }
        for (let i = 0; i < 20; i++) {
            const x = (8 + Math.random() * (MAP_W - 16)) * TILE;
            const y = (8 + Math.random() * (MAP_H - 16)) * TILE;
            this.createLoot(x, y);
        }
    }

    createLoot(x, y) {
        const l = this.lootItems.create(x, y, 'crate');
        l.amt = 5 + Math.floor(Math.random() * 12);
        l.looted = false;
        l.body.setSize(TILE - 10, TILE - 10);
        l.setDepth(8);
    }

    shoot() {
        if (this.player.shootCD > 0 || this.player.ammo <= 0 || this.player.reloading) return;

        const ptr = this.input.activePointer;
        const wx = ptr.worldX, wy = ptr.worldY;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, wx, wy);
        const spread = this.keys.shift.isDown ? 0.12 : 0.04;
        const ang = angle + (Math.random() - 0.5) * spread;

        const b = this.bullets.create(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            'bullet'
        );
        b.friendly = true;
        b.dmg = 28;
        this.physics.velocityFromRotation(ang, 650, b.body.velocity);
        b.setDepth(20);

        this.player.ammo--;
        this.player.shootCD = 120;

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(angle) * 30,
            this.player.y + Math.sin(angle) * 30,
            20, 0xffcc00, 0.8
        ).setDepth(25);
        this.time.delayedCall(80, () => flash.destroy());
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Player movement
        let dx = 0, dy = 0;
        if (this.keys.w.isDown) dy--;
        if (this.keys.s.isDown) dy++;
        if (this.keys.a.isDown) dx--;
        if (this.keys.d.isDown) dx++;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        const running = this.keys.shift.isDown && this.player.stam > 0 && (dx || dy);
        const speed = running ? 280 : 160;

        if (running) {
            this.player.stam -= 25 * dt;
            if (this.player.stam < 0) this.player.stam = 0;
        } else if (this.player.stam < this.player.maxStam) {
            this.player.stam += 18 * dt;
        }

        this.player.setVelocity(dx * speed, dy * speed);

        // Player rotation
        const ptr = this.input.activePointer;
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, ptr.worldX, ptr.worldY);

        // Shoot cooldown
        if (this.player.shootCD > 0) this.player.shootCD -= delta;

        // Reload
        if (this.player.reloading) {
            this.player.reloadTimer -= delta;
            if (this.player.reloadTimer <= 0) {
                this.player.ammo = this.player.maxAmmo;
                this.player.reloading = false;
            }
        }

        // Bleeding
        if (this.player.bleeding) {
            this.player.bleedTimer -= delta;
            if (this.player.bleedTimer <= 0) {
                this.player.hp -= 2;
                this.player.bleedTimer = 1000;
                this.bloodStains.push({ x: this.player.x, y: this.player.y, a: 1 });
            }
        }

        // Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.r) && !this.player.reloading && this.player.ammo < this.player.maxAmmo) {
            this.player.reloading = true;
            this.player.reloadTimer = 1800;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
            this.lootItems.children.each(l => {
                if (!l.looted && Phaser.Math.Distance.Between(this.player.x, this.player.y, l.x, l.y) < 70) {
                    l.looted = true;
                    l.setVisible(false);
                    this.player.items += l.amt;
                }
            });
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.f) && this.player.items >= 10 && this.player.hp < this.player.maxHp) {
            this.player.items -= 10;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
            this.player.bleeding = false;
        }

        // Enemies
        this.enemies.children.each(e => {
            if (!e.active) return;
            const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
            if (dist < e.vision) e.alert = true;

            if (e.alert) {
                const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
                e.rotation = angle;

                if (dist > e.range * 0.6) {
                    this.physics.velocityFromRotation(angle, e.speed, e.body.velocity);
                } else {
                    e.setVelocity(0, 0);
                }

                e.cd -= delta;
                if (e.cd <= 0 && dist < e.range) {
                    if (e.type === 'bandit') {
                        const b = this.bullets.create(e.x + Math.cos(angle) * 20, e.y + Math.sin(angle) * 20, 'bullet');
                        b.friendly = false;
                        b.dmg = e.dmg;
                        const ang = angle + (Math.random() - 0.5) * 0.15;
                        this.physics.velocityFromRotation(ang, 400, b.body.velocity);
                        e.cd = 1000;
                    } else {
                        this.player.hp -= e.dmg;
                        if (Math.random() < 0.4) this.player.bleeding = true;
                        this.bloodStains.push({ x: this.player.x, y: this.player.y, a: 1 });
                        e.cd = 700;
                    }
                }
            } else {
                e.patrolTimer -= delta;
                if (e.patrolTimer <= 0) {
                    e.patrolAngle = Math.random() * Math.PI * 2;
                    e.patrolTimer = 2000 + Math.random() * 3000;
                }
                this.physics.velocityFromRotation(e.patrolAngle, e.speed * 0.25, e.body.velocity);
            }
        });

        // Bullet collisions
        this.physics.collide(this.bullets, this.walls, (b) => b.destroy());
        this.bullets.children.each(b => {
            if (!b.active) return;
            if (b.friendly) {
                this.enemies.children.each(e => {
                    if (e.active && Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y) < 22) {
                        e.hp -= b.dmg;
                        e.alert = true;
                        this.bloodStains.push({ x: e.x, y: e.y, a: 1 });
                        b.destroy();
                        if (e.hp <= 0) {
                            e.destroy();
                            this.player.items += 4;
                        }
                    }
                });
            } else {
                if (Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y) < 22) {
                    this.player.hp -= b.dmg;
                    if (Math.random() < 0.3) this.player.bleeding = true;
                    this.bloodStains.push({ x: this.player.x, y: this.player.y, a: 1 });
                    b.destroy();
                }
            }
        });

        // Player-wall collision
        this.physics.collide(this.player, this.walls);
        this.physics.collide(this.enemies, this.walls);

        // Check win/lose
        const extractDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extract.x, this.extract.y);
        if (extractDist < this.extract.r) {
            this.scene.start('WinScene', { loot: this.player.items });
        }
        if (this.player.hp <= 0) {
            this.scene.start('DeadScene', { loot: this.player.items });
        }

        // Draw effects
        this.drawBlood();
        this.drawExtraction();
        this.drawRain(dt);
        this.drawHUD();
        this.drawEnemyHP();
        this.drawLootPrompts();
    }

    drawBlood() {
        this.bloodGfx.clear();
        for (let i = this.bloodStains.length - 1; i >= 0; i--) {
            const b = this.bloodStains[i];
            this.bloodGfx.fillStyle(0x641414, b.a * 0.6);
            this.bloodGfx.fillCircle(b.x, b.y, 12);
            b.a -= 0.001;
            if (b.a <= 0) this.bloodStains.splice(i, 1);
        }
    }

    drawExtraction() {
        this.extractGfx.clear();
        const pulse = Math.sin(this.time.now / 200) * 0.3 + 0.7;
        this.extractGfx.lineStyle(4, 0x44ff88, pulse);
        this.extractGfx.strokeCircle(this.extract.x, this.extract.y, this.extract.r);
        this.extractGfx.setDepth(6);
    }

    drawRain(dt) {
        this.rainGfx.clear();
        this.rainGfx.lineStyle(1, 0x9696b4, 0.35);
        const cx = this.cameras.main.scrollX, cy = this.cameras.main.scrollY;
        for (const d of this.rain) {
            this.rainGfx.lineBetween(d.x, d.y, d.x + 8, d.y + d.l);
            d.x += 150 * dt; d.y += d.s * dt;
            if (d.y > this.cameras.main.height) { d.y = -d.l; d.x = Math.random() * this.cameras.main.width; }
            if (d.x > this.cameras.main.width) d.x = 0;
        }
    }

    drawHUD() {
        const p = 20, w = this.cameras.main.width;
        this.hudGfx.clear();

        // HP bar
        this.hudGfx.fillStyle(0x111111); this.hudGfx.fillRect(p, p, 230, 30);
        this.hudGfx.fillStyle(this.player.bleeding ? 0x8a2222 : 0xcc3333);
        this.hudGfx.fillRect(p + 2, p + 2, 226 * (this.player.hp / this.player.maxHp), 26);

        // Stamina bar
        this.hudGfx.fillStyle(0x111111); this.hudGfx.fillRect(p, p + 36, 230, 24);
        this.hudGfx.fillStyle(0x2a8a2a);
        this.hudGfx.fillRect(p + 2, p + 38, 226 * (this.player.stam / this.player.maxStam), 20);

        // Minimap
        const ms = 170, mx = w - ms - p, my = this.cameras.main.height - ms - p;
        this.hudGfx.fillStyle(0x000000, 0.8); this.hudGfx.fillRect(mx, my, ms, ms);
        this.hudGfx.lineStyle(2, 0x444444); this.hudGfx.strokeRect(mx, my, ms, ms);
        const sx = ms / (MAP_W * TILE), sy = ms / (MAP_H * TILE);
        this.hudGfx.fillStyle(0x44ff44); this.hudGfx.fillCircle(mx + this.player.x * sx, my + this.player.y * sy, 5);
        this.hudGfx.fillStyle(0x44ffff); this.hudGfx.fillCircle(mx + this.extract.x * sx, my + this.extract.y * sy, 7);
        this.enemies.children.each(e => {
            if (e.active && e.alert) {
                this.hudGfx.fillStyle(0xff4444);
                this.hudGfx.fillCircle(mx + e.x * sx, my + e.y * sy, 3);
            }
        });

        // Text
        this.hudText.setText(
            `HP                                AMMO: ${this.player.ammo}/${this.player.maxAmmo}\n` +
            `>>>                               ${this.player.reloading ? 'RELOADING...' : ''}\n` +
            `${this.player.bleeding ? 'BLEEDING [F to heal]' : ''}                LOOT: ${this.player.items}\n` +
            `                                  EXTRACT: ${Math.floor(Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extract.x, this.extract.y) / 3)}m`
        );
        this.hudText.setPosition(p + 10, p + 5);
    }

    drawEnemyHP() {
        this.enemies.children.each(e => {
            if (!e.active) return;
            // Use existing graphics
        });
    }

    drawLootPrompts() {
        this.lootItems.children.each(l => {
            if (l.looted || !l.visible) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, l.x, l.y);
            if (dist < 70 && !l.promptText) {
                l.promptText = this.add.text(l.x, l.y - TILE/2 - 10, '[E] LOOT', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#ffd700', fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(50);
            } else if (dist >= 70 && l.promptText) {
                l.promptText.destroy();
                l.promptText = null;
            }
        });
    }
}

class WinScene extends Phaser.Scene {
    constructor() { super('WinScene'); }

    init(data) { this.loot = data.loot || 0; }

    create() {
        const cx = this.cameras.main.width / 2, cy = this.cameras.main.height / 2;
        this.cameras.main.setBackgroundColor('#000000');
        this.add.text(cx, cy - 60, 'EXTRACTED!', { fontFamily: 'monospace', fontSize: '60px', color: '#4f4', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(cx, cy + 20, `Loot: ${this.loot}`, { fontFamily: 'monospace', fontSize: '30px', color: '#ffd700' }).setOrigin(0.5);
        this.add.text(cx, cy + 90, 'SPACE to play again', { fontFamily: 'monospace', fontSize: '24px', color: '#4f4' }).setOrigin(0.5);
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class DeadScene extends Phaser.Scene {
    constructor() { super('DeadScene'); }

    init(data) { this.loot = data.loot || 0; }

    create() {
        const cx = this.cameras.main.width / 2, cy = this.cameras.main.height / 2;
        this.cameras.main.setBackgroundColor('#280000');
        this.add.text(cx, cy - 60, 'YOU DIED', { fontFamily: 'monospace', fontSize: '60px', color: '#c33', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(cx, cy + 20, `Lost: ${this.loot} loot`, { fontFamily: 'monospace', fontSize: '30px', color: '#888' }).setOrigin(0.5);
        this.add.text(cx, cy + 90, 'SPACE to retry', { fontFamily: 'monospace', fontSize: '24px', color: '#c33' }).setOrigin(0.5);
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

const config = {
    type: Phaser.CANVAS,
    width: Math.max(1280, window.innerWidth),
    height: Math.max(720, window.innerHeight),
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MenuScene, GameScene, WinScene, DeadScene]
};

const game = new Phaser.Game(config);
