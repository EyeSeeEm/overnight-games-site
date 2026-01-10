// Tower Wizard Clone - Phaser 3 Version
// Incremental/Idle Game

const COLORS = {
    bg: 0x1a1a2e,
    bgLight: 0x2a2a4e,
    mountain1: 0x252545,
    mountain2: 0x1e1e3e,
    mountain3: 0x151530,
    pink: 0xe8a0a0,
    pinkLight: 0xf0b8b8,
    pinkDark: 0xc88080,
    salmon: 0xd4918f,
    towerPink: 0xd4918f,
    towerLight: 0xe8b0b0,
    towerRoof: 0xc07878,
    towerWindow: 0x2a2a4e,
    panelBg: 0x0a0a1a,
    panelBorder: 0xc88080,
    magic: 0x9370db,
    knowledge: 0x6495ed,
    wood: 0x8b6b4a,
    spirits: 0xe8a0a0,
    orbDark: 0x1a1a3e,
    orbGlow: 0xff69b4,
    button: 0x4b0082,
    buttonDisabled: 0x2a2a3a
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.gameData = {
            tick: 0,
            magic: 0,
            lifetimeMagic: 0,
            spirits: 0,
            knowledge: 0,
            wood: 0,
            towerLevel: 1,
            prestigePoints: 0,
            cloudlings: 0,
            spiritTomes: 0,
            druids: 0,
            wizardMagic: 0,
            selectedRoom: 'orb',
            orbHeld: false,
            orbClickCooldown: 0
        };

        this.particles = [];
        this.floatingSpirits = [];

        // Create graphics layers
        this.bgGraphics = this.add.graphics();
        this.towerGraphics = this.add.graphics();
        this.orbGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();
        this.particleGraphics = this.add.graphics();

        // Draw static background
        this.drawBackground();

        // Create text objects for UI
        this.createUIText();

        // Create interactive orb zone
        this.orbZone = this.add.zone(200, 120, 100, 100).setInteractive();

        this.orbZone.on('pointerdown', () => {
            this.gameData.orbHeld = true;
            this.clickOrb();
        });

        this.orbZone.on('pointerup', () => {
            this.gameData.orbHeld = false;
        });

        this.orbZone.on('pointerout', () => {
            this.gameData.orbHeld = false;
        });

        // Create buttons
        this.createButtons();

        // Initialize floating spirits
        for (let i = 0; i < 3; i++) {
            this.createFloatingSpirit();
        }

        // Expose for testing
        window.game = this.gameData;
        window.gameState = { state: 'playing' };
    }

    drawBackground() {
        const g = this.bgGraphics;
        const w = this.scale.width;
        const h = this.scale.height;

        // Sky gradient
        g.fillStyle(COLORS.bg);
        g.fillRect(0, 0, w, h);

        // Mountain layers
        const layers = [
            { color: COLORS.mountain3, height: 0.5, offset: 0 },
            { color: COLORS.mountain2, height: 0.4, offset: 100 },
            { color: COLORS.mountain1, height: 0.3, offset: 200 }
        ];

        for (const layer of layers) {
            g.fillStyle(layer.color);
            g.beginPath();
            g.moveTo(0, h);

            for (let x = 0; x <= w; x += 20) {
                const baseY = h - h * layer.height;
                const peakY = baseY - Math.sin((x + layer.offset) * 0.01) * 100
                             - Math.sin((x + layer.offset) * 0.02) * 50;
                g.lineTo(x, peakY);
            }

            g.lineTo(w, h);
            g.closePath();
            g.fillPath();
        }

        // Dark tree silhouettes
        g.fillStyle(0x0a0a1a);
        for (let x = 0; x < w; x += 30) {
            const treeHeight = 20 + Math.random() * 30;
            g.fillTriangle(x, h - 50, x + 10, h - 50 - treeHeight, x + 20, h - 50);
        }

        // Pink trees
        g.fillStyle(COLORS.salmon);
        for (let x = 50; x < 350; x += 40) {
            const treeHeight = 40 + Math.sin(x) * 20;
            // Trunk
            g.fillStyle(COLORS.pinkDark);
            g.fillRect(x + 8, h - 80, 4, 20);
            // Foliage
            g.fillStyle(COLORS.salmon);
            g.fillTriangle(x, h - 80, x + 10, h - 80 - treeHeight, x + 20, h - 80);
        }

        // Cloud
        g.fillStyle(0x4a6080);
        g.fillCircle(w - 200, 80, 24);
        g.fillCircle(w - 176, 68, 18);
        g.fillCircle(w - 158, 80, 21);
    }

    createUIText() {
        const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };
        const dimStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#a0a0a0' };

        // Resource panel texts
        this.resourceTitle = this.add.text(30, 30, 'Resources', { ...textStyle, fontStyle: 'bold', fontSize: '14px' });
        this.magicText = this.add.text(30, 55, '', textStyle);
        this.spiritsText = this.add.text(30, 75, '', textStyle);
        this.knowledgeText = this.add.text(30, 95, '', textStyle);
        this.woodText = this.add.text(30, 115, '', textStyle);

        // Action panel texts
        const panelX = this.scale.width - 310;
        this.roomTitle = this.add.text(panelX + 10, 215, 'Orb Room', { ...textStyle, fontStyle: 'bold', fontSize: '16px' });
        this.summonCostText = this.add.text(panelX + 10, 285, '', textStyle);
        this.roomInfo1 = this.add.text(panelX + 10, 320, '', textStyle);
        this.roomInfo2 = this.add.text(panelX + 10, 340, '', textStyle);

        this.towerLevelText = this.add.text(panelX + 10, 420, '', { ...textStyle, fontStyle: 'bold', fontSize: '14px' });
        this.ascendReqText = this.add.text(panelX + 10, 445, '', dimStyle);
        this.lifetimeText = this.add.text(panelX + 10, 520, '', { ...dimStyle, fontSize: '11px' });
        this.prestigeText = this.add.text(panelX + 10, 540, '', { ...dimStyle, fontSize: '11px' });

        // Orb click text
        this.orbClickText = this.add.text(200, 55, '+1', {
            fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#e8a0a0'
        }).setOrigin(0.5);

        this.orbHintText = this.add.text(200, 180, 'Click orb for magic', {
            fontFamily: 'monospace', fontSize: '12px', color: '#a0a0a0'
        }).setOrigin(0.5);
    }

    createButtons() {
        const panelX = this.scale.width - 310;

        // Summon Spirit button
        this.summonBtn = this.createButton(panelX + 10, 255, 280, 35, 'Summon Spirit', () => {
            this.summonSpirit();
        });

        // Assign/Remove buttons
        this.assignBtn = this.createButton(panelX + 10, 360, 130, 35, 'Assign +1', () => {
            this.assignSpirit(this.gameData.selectedRoom === 'orb' ? 'cloudling' :
                            this.gameData.selectedRoom === 'study' ? 'spiritTome' : 'druid');
        });

        this.removeBtn = this.createButton(panelX + 150, 360, 130, 35, 'Remove -1', () => {
            this.unassignSpirit(this.gameData.selectedRoom === 'orb' ? 'cloudling' :
                              this.gameData.selectedRoom === 'study' ? 'spiritTome' : 'druid');
        });

        // Ascend button
        this.ascendBtn = this.createButton(panelX + 10, 470, 280, 35, 'Ascend Tower', () => {
            this.ascend();
        });

        // Room navigation buttons
        const navY = this.scale.height - 60;
        const startX = this.scale.width / 2 - 150;

        this.orbRoomBtn = this.createButton(startX, navY, 90, 40, 'Orb', () => {
            this.gameData.selectedRoom = 'orb';
        });

        this.studyRoomBtn = this.createButton(startX + 100, navY, 90, 40, 'Study', () => {
            if (this.gameData.towerLevel >= 2) this.gameData.selectedRoom = 'study';
        });

        this.forestRoomBtn = this.createButton(startX + 200, navY, 90, 40, 'Forest', () => {
            if (this.gameData.towerLevel >= 3) this.gameData.selectedRoom = 'forest';
        });
    }

    createButton(x, y, w, h, text, callback) {
        const btn = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(COLORS.button);
        bg.fillRect(0, 0, w, h);
        bg.lineStyle(2, COLORS.panelBorder);
        bg.strokeRect(0, 0, w, h);

        const label = this.add.text(w/2, h/2, text, {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, label]);
        btn.setSize(w, h);
        btn.setInteractive();

        btn.on('pointerdown', callback);

        btn.bg = bg;
        btn.label = label;
        btn.w = w;
        btn.h = h;

        return btn;
    }

    updateButton(btn, enabled) {
        btn.bg.clear();
        btn.bg.fillStyle(enabled ? COLORS.button : COLORS.buttonDisabled);
        btn.bg.fillRect(0, 0, btn.w, btn.h);
        btn.bg.lineStyle(2, enabled ? COLORS.panelBorder : 0x4a4a5a);
        btn.bg.strokeRect(0, 0, btn.w, btn.h);
        btn.label.setColor(enabled ? '#ffffff' : '#808080');
    }

    clickOrb() {
        if (this.gameData.orbClickCooldown > 0) return;

        const magicGain = this.getMagicPerClick();
        this.gameData.magic += magicGain;
        this.gameData.lifetimeMagic += magicGain;
        this.gameData.orbClickCooldown = 0.05;

        // Create particles
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: 200 + (Math.random() - 0.5) * 60,
                y: 120 + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 100 - 50,
                life: 0.8,
                color: i % 2 === 0 ? COLORS.orbGlow : COLORS.magic
            });
        }
    }

    getMagicPerClick() {
        return Math.pow(2, this.gameData.wizardMagic);
    }

    getSpiritCost() {
        return Math.floor(10 * Math.pow(1.15, this.gameData.spirits));
    }

    getTotalAssigned() {
        return this.gameData.cloudlings + this.gameData.spiritTomes + this.gameData.druids;
    }

    summonSpirit() {
        const cost = this.getSpiritCost();
        if (this.gameData.magic >= cost) {
            this.gameData.magic -= cost;
            this.gameData.spirits++;
            this.createFloatingSpirit();
        }
    }

    assignSpirit(type) {
        if (this.gameData.spirits <= this.getTotalAssigned()) return;

        switch(type) {
            case 'cloudling': this.gameData.cloudlings++; break;
            case 'spiritTome':
                if (this.gameData.towerLevel >= 2) this.gameData.spiritTomes++;
                break;
            case 'druid':
                if (this.gameData.towerLevel >= 3) this.gameData.druids++;
                break;
        }
    }

    unassignSpirit(type) {
        switch(type) {
            case 'cloudling': if (this.gameData.cloudlings > 0) this.gameData.cloudlings--; break;
            case 'spiritTome': if (this.gameData.spiritTomes > 0) this.gameData.spiritTomes--; break;
            case 'druid': if (this.gameData.druids > 0) this.gameData.druids--; break;
        }
    }

    canAscend() {
        const costs = [0, 100, 1000, 10000, 50000, 200000];
        if (this.gameData.towerLevel >= costs.length) return false;
        return this.gameData.lifetimeMagic >= costs[this.gameData.towerLevel];
    }

    ascend() {
        if (this.canAscend()) {
            this.gameData.towerLevel++;
        }
    }

    createFloatingSpirit() {
        this.floatingSpirits.push({
            x: 200 + Math.random() * 100,
            y: 200 + Math.random() * 200,
            bob: Math.random() * Math.PI * 2
        });
    }

    formatNumber(n) {
        if (n < 1000) return Math.floor(n).toString();
        if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
        if (n < 1000000000) return (n / 1000000).toFixed(1) + 'M';
        return (n / 1000000000).toFixed(1) + 'B';
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.gameData.tick++;

        // Orb cooldown
        if (this.gameData.orbClickCooldown > 0) {
            this.gameData.orbClickCooldown -= dt;
        }

        // Auto-click while holding orb
        if (this.gameData.orbHeld && this.gameData.orbClickCooldown <= 0) {
            this.clickOrb();
        }

        // Cloudling magic generation
        const cloudlingMagic = this.gameData.cloudlings * 0.5 * dt;
        this.gameData.magic += cloudlingMagic;
        this.gameData.lifetimeMagic += cloudlingMagic;

        // Knowledge generation
        if (this.gameData.towerLevel >= 2) {
            this.gameData.knowledge += this.gameData.spiritTomes * 0.2 * dt;
        }

        // Wood generation
        if (this.gameData.towerLevel >= 3) {
            this.gameData.wood += this.gameData.druids * 0.3 * dt;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 50 * dt;
            p.life -= dt * 2;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating spirits
        for (const spirit of this.floatingSpirits) {
            spirit.bob += dt * 2;
        }

        // Draw dynamic elements
        this.drawDynamic();

        // Update UI
        this.updateUI();
    }

    drawDynamic() {
        const g = this.towerGraphics;
        g.clear();

        const h = this.scale.height;
        const towerX = 320;
        const towerBaseY = h - 100;
        const floorHeight = 80;

        // Draw tower floors
        for (let i = 0; i < this.gameData.towerLevel && i < 6; i++) {
            const floorY = towerBaseY - i * floorHeight;
            const width = 60;
            const height = 70;

            // Main body
            g.fillStyle(COLORS.towerPink);
            g.fillRect(towerX - width/2, floorY - height, width, height);

            // Highlight
            g.fillStyle(COLORS.towerLight);
            g.fillRect(towerX - width/2, floorY - height, 4, height);

            // Shadow
            g.fillStyle(COLORS.pinkDark);
            g.fillRect(towerX + width/2 - 4, floorY - height, 4, height);

            // Window
            g.fillStyle(COLORS.towerWindow);
            g.fillRect(towerX - 8, floorY - height + 20, 16, 24);

            // Window glow
            g.fillStyle(0x4a5a8a);
            g.fillRect(towerX - 6, floorY - height + 22, 4, 8);
        }

        // Draw roof
        const roofY = towerBaseY - this.gameData.towerLevel * floorHeight;
        g.fillStyle(COLORS.towerRoof);
        g.fillTriangle(towerX - 40, roofY, towerX, roofY - 60, towerX + 40, roofY);
        g.fillStyle(COLORS.towerLight);
        g.fillTriangle(towerX - 35, roofY - 5, towerX - 5, roofY - 50, towerX - 5, roofY - 5);

        // Draw orb
        const orbG = this.orbGraphics;
        orbG.clear();

        // Orb glow
        orbG.fillStyle(COLORS.orbGlow, 0.2);
        orbG.fillCircle(200, 120, 80);

        // Orb body
        orbG.fillStyle(COLORS.orbDark);
        orbG.fillCircle(200, 120, 45);

        // Orb highlight
        orbG.fillStyle(0xffffff, 0.3);
        orbG.fillCircle(185, 105, 8);

        // Stars inside orb
        orbG.fillStyle(0xffffff);
        for (let i = 0; i < 5; i++) {
            const angle = this.gameData.tick * 0.02 + i * Math.PI * 0.4;
            const dist = 15 + Math.sin(this.gameData.tick * 0.05 + i) * 10;
            const sx = 200 + Math.cos(angle) * dist;
            const sy = 120 + Math.sin(angle) * dist;
            orbG.fillRect(sx - 1, sy - 1, 2, 2);
        }

        // Draw floating spirits
        for (let i = 0; i < Math.min(this.floatingSpirits.length, 20); i++) {
            const spirit = this.floatingSpirits[i];
            const bobY = Math.sin(spirit.bob) * 5;

            orbG.fillStyle(COLORS.spirits);
            orbG.fillCircle(spirit.x, spirit.y + bobY, 6);

            // Eyes
            orbG.fillStyle(COLORS.panelBg);
            orbG.fillRect(spirit.x - 3, spirit.y + bobY - 2, 2, 2);
            orbG.fillRect(spirit.x + 1, spirit.y + bobY - 2, 2, 2);
        }

        // Draw particles
        const pg = this.particleGraphics;
        pg.clear();

        for (const p of this.particles) {
            pg.fillStyle(p.color, p.life);
            pg.fillCircle(p.x, p.y, 4);
        }

        // Draw UI panels
        this.drawUIPanels();
    }

    drawUIPanels() {
        const g = this.uiGraphics;
        g.clear();

        // Resource panel
        g.fillStyle(COLORS.panelBg);
        g.fillRect(20, 20, 160, 120);
        g.lineStyle(2, COLORS.panelBorder);
        g.strokeRect(20, 20, 160, 120);

        // Action panel
        const panelX = this.scale.width - 320;
        g.fillStyle(COLORS.panelBg);
        g.fillRect(panelX, 200, 300, 360);
        g.lineStyle(2, COLORS.panelBorder);
        g.strokeRect(panelX, 200, 300, 360);
    }

    updateUI() {
        // Resource texts
        this.magicText.setText(`* ${this.formatNumber(this.gameData.magic)}`);
        this.spiritsText.setText(`@ ${this.getTotalAssigned()}/${this.gameData.spirits}`);
        this.knowledgeText.setText(`+ ${this.formatNumber(this.gameData.knowledge)}`);
        this.woodText.setText(`# ${this.formatNumber(this.gameData.wood)}`);

        // Room title
        const roomTitles = { orb: 'Orb Room', study: 'Study', forest: 'Forestry' };
        this.roomTitle.setText(roomTitles[this.gameData.selectedRoom]);

        // Summon cost
        this.summonCostText.setText(`Cost: ${this.formatNumber(this.getSpiritCost())} magic`);

        // Room info
        if (this.gameData.selectedRoom === 'orb') {
            this.roomInfo1.setText(`Cloudlings: ${this.gameData.cloudlings}`);
            this.roomInfo2.setText(`Magic/sec: ${this.formatNumber(this.gameData.cloudlings * 0.5)}`);
        } else if (this.gameData.selectedRoom === 'study') {
            if (this.gameData.towerLevel >= 2) {
                this.roomInfo1.setText(`Spirit Tomes: ${this.gameData.spiritTomes}`);
                this.roomInfo2.setText(`Knowledge/sec: ${this.formatNumber(this.gameData.spiritTomes * 0.2)}`);
            } else {
                this.roomInfo1.setText('Unlock at Tower Level 2');
                this.roomInfo2.setText('');
            }
        } else {
            if (this.gameData.towerLevel >= 3) {
                this.roomInfo1.setText(`Druids: ${this.gameData.druids}`);
                this.roomInfo2.setText(`Wood/sec: ${this.formatNumber(this.gameData.druids * 0.3)}`);
            } else {
                this.roomInfo1.setText('Unlock at Tower Level 3');
                this.roomInfo2.setText('');
            }
        }

        // Tower info
        this.towerLevelText.setText(`Tower Level: ${this.gameData.towerLevel}`);

        const costs = [0, 100, 1000, 10000, 50000, 200000];
        if (this.gameData.towerLevel < costs.length) {
            this.ascendReqText.setText(`Next: ${this.formatNumber(costs[this.gameData.towerLevel])} lifetime magic`);
        } else {
            this.ascendReqText.setText('Max level reached');
        }

        this.lifetimeText.setText(`Lifetime Magic: ${this.formatNumber(this.gameData.lifetimeMagic)}`);
        this.prestigeText.setText(`Prestige Points: ${this.gameData.prestigePoints}`);

        // Orb click text
        this.orbClickText.setText(`+${this.formatNumber(this.getMagicPerClick())}`);

        // Update buttons
        const spiritCost = this.getSpiritCost();
        this.updateButton(this.summonBtn, this.gameData.magic >= spiritCost);

        const freeSpirits = this.gameData.spirits - this.getTotalAssigned();
        this.updateButton(this.assignBtn, freeSpirits > 0);

        const assignedCount = this.gameData.selectedRoom === 'orb' ? this.gameData.cloudlings :
                             this.gameData.selectedRoom === 'study' ? this.gameData.spiritTomes :
                             this.gameData.druids;
        this.updateButton(this.removeBtn, assignedCount > 0);

        this.updateButton(this.ascendBtn, this.canAscend());

        // Room nav buttons
        this.updateButton(this.orbRoomBtn, true);
        this.orbRoomBtn.bg.fillStyle(this.gameData.selectedRoom === 'orb' ? COLORS.panelBorder : COLORS.button);
        this.orbRoomBtn.bg.fillRect(0, 0, 90, 40);

        this.updateButton(this.studyRoomBtn, this.gameData.towerLevel >= 2);
        if (this.gameData.selectedRoom === 'study') {
            this.studyRoomBtn.bg.fillStyle(COLORS.panelBorder);
            this.studyRoomBtn.bg.fillRect(0, 0, 90, 40);
        }

        this.updateButton(this.forestRoomBtn, this.gameData.towerLevel >= 3);
        if (this.gameData.selectedRoom === 'forest') {
            this.forestRoomBtn.bg.fillStyle(COLORS.panelBorder);
            this.forestRoomBtn.bg.fillRect(0, 0, 90, 40);
        }
    }
}

const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    canvas: document.createElement('canvas'),
    scene: [GameScene],
    render: {
        pixelArt: true
    }
};

document.body.appendChild(config.canvas);
const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
