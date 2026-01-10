// Zero Sievert Clone - Extraction Shooter
// Procedural pixel art - dark post-apocalyptic style

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Fullscreen
canvas.width = Math.max(1280, window.innerWidth);
canvas.height = Math.max(720, window.innerHeight);
window.addEventListener('resize', () => {
    canvas.width = Math.max(1280, window.innerWidth);
    canvas.height = Math.max(720, window.innerHeight);
});

const TILE = 48;
const textures = {};

function tex(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    return c;
}

function initTex() {
    textures.grass1 = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#2d4a28'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 20; i++) {
            c.fillStyle = Math.random() > 0.5 ? '#3a5a32' : '#254020';
            c.fillRect(Math.random() * w, Math.random() * h, 3, 3);
        }
    });
    textures.grass2 = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#345530'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 15; i++) {
            c.fillStyle = Math.random() > 0.5 ? '#2d4a28' : '#3d6035';
            c.fillRect(Math.random() * w, Math.random() * h, 4, 4);
        }
    });
    textures.dirt = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#5a4535'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 12; i++) {
            c.fillStyle = Math.random() > 0.5 ? '#4a3a2a' : '#6a5545';
            c.fillRect(Math.random() * w, Math.random() * h, 5, 5);
        }
    });
    textures.tree = tex(TILE, TILE * 1.5, (c, w, h) => {
        c.fillStyle = '#3a2a1a'; c.fillRect(w/2 - 4, h - 20, 8, 20);
        ['#1a3a18', '#2a4a25', '#1a3015'].forEach((col, i) => {
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(w/2, i * 15);
            c.lineTo(w - 5 - i * 3, h - 25 - i * 8);
            c.lineTo(5 + i * 3, h - 25 - i * 8);
            c.closePath(); c.fill();
        });
    });
    textures.wall = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#4a3830'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#3a2820'; c.lineWidth = 1;
        for (let y = 8; y < h; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    });
    textures.floor = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#3a3535'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#2a2525'; c.strokeRect(0, 0, w/2, h/2); c.strokeRect(w/2, h/2, w/2, h/2);
    });
    textures.door = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#3a3535'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#5a4535'; c.fillRect(8, 4, w - 16, h - 4);
        c.fillStyle = '#6a5545'; c.fillRect(w/2 + 8, h/2, 6, 6);
    });
    textures.player = tex(40, 40, (c) => {
        c.fillStyle = '#3a5545'; c.fillRect(8, 10, 24, 22);
        c.fillStyle = '#c4a080'; c.fillRect(12, 2, 16, 14);
        c.fillStyle = '#2a3530'; c.fillRect(10, 0, 20, 8);
        c.fillStyle = '#3a5545'; c.fillRect(2, 14, 8, 14); c.fillRect(30, 14, 8, 14);
    });
    textures.bandit = tex(40, 40, (c) => {
        c.fillStyle = '#5a4540'; c.fillRect(8, 10, 24, 22);
        c.fillStyle = '#c4a080'; c.fillRect(12, 2, 16, 14);
        c.fillStyle = '#8a3030'; c.fillRect(10, 6, 20, 6);
    });
    textures.mutant = tex(40, 40, (c) => {
        c.fillStyle = '#4a6a50'; c.fillRect(6, 8, 28, 26);
        c.fillStyle = '#5a7a5a'; c.fillRect(10, 0, 20, 16);
        c.fillStyle = '#ff4444'; c.fillRect(14, 6, 4, 4); c.fillRect(22, 6, 4, 4);
    });
    textures.crate = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#5a5040'; c.fillRect(4, 8, w - 8, h - 12);
        c.strokeStyle = '#3a3020'; c.lineWidth = 2; c.strokeRect(4, 8, w - 8, h - 12);
        c.fillStyle = '#6a6a6a'; c.fillRect(6, 14, w - 12, 4); c.fillRect(6, h - 14, w - 12, 4);
    });
}

let state = 'menu', cam = {x: 0, y: 0}, player, enemies = [], bullets = [], loot = [], particles = [], blood = [], extract, keys = {}, mouse = {x: 0, y: 0, down: false}, map = {t: [], w: 80, h: 60}, rain = [];

class Player {
    constructor(x, y) {
        Object.assign(this, {x, y, speed: 160, sprint: 280, hp: 100, maxHp: 100, stam: 100, maxStam: 100, ammo: 30, maxAmmo: 30, items: 0, angle: 0, bleeding: false, bleedT: 0, shootCD: 0, reloading: false, reloadT: 0, running: false});
    }
    update(dt) {
        let dx = 0, dy = 0;
        if (keys.w || keys.arrowup) dy--;
        if (keys.s || keys.arrowdown) dy++;
        if (keys.a || keys.arrowleft) dx--;
        if (keys.d || keys.arrowright) dx++;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        this.running = keys.shift && this.stam > 0 && (dx || dy);
        const spd = this.running ? this.sprint : this.speed;
        if (this.running) { this.stam -= 25 * dt; if (this.stam < 0) this.stam = 0; }
        else if (this.stam < this.maxStam) { this.stam += 18 * dt; if (this.stam > this.maxStam) this.stam = this.maxStam; }
        const nx = this.x + dx * spd * dt, ny = this.y + dy * spd * dt;
        if (!collide(nx, this.y, 16)) this.x = nx;
        if (!collide(this.x, ny, 16)) this.y = ny;
        this.x = Math.max(20, Math.min(map.w * TILE - 20, this.x));
        this.y = Math.max(20, Math.min(map.h * TILE - 20, this.y));
        this.angle = Math.atan2(mouse.y + cam.y - this.y, mouse.x + cam.x - this.x);
        if (this.shootCD > 0) this.shootCD -= dt;
        if (this.reloading) { this.reloadT -= dt; if (this.reloadT <= 0) { this.ammo = this.maxAmmo; this.reloading = false; } }
        if (this.bleeding) { this.bleedT -= dt; if (this.bleedT <= 0) { this.hp -= 2; this.bleedT = 1; blood.push({x: this.x, y: this.y, a: 1}); } }
    }
    shoot() {
        if (this.shootCD > 0 || this.ammo <= 0 || this.reloading) return;
        const spr = this.running ? 0.12 : 0.04, ang = this.angle + (Math.random() - 0.5) * spr;
        bullets.push({x: this.x + Math.cos(this.angle) * 25, y: this.y + Math.sin(this.angle) * 25, vx: Math.cos(ang) * 650, vy: Math.sin(ang) * 650, friendly: true, dmg: 28});
        this.ammo--; this.shootCD = 0.12;
        particles.push({x: this.x + Math.cos(this.angle) * 30, y: this.y + Math.sin(this.angle) * 30, c: '#ffaa00', t: 'flash', life: 0.08, max: 0.08});
    }
    reload() { if (!this.reloading && this.ammo < this.maxAmmo) { this.reloading = true; this.reloadT = 1.8; } }
    heal() { if (this.items >= 10 && this.hp < this.maxHp) { this.items -= 10; this.hp = Math.min(this.maxHp, this.hp + 35); this.bleeding = false; } }
    draw() {
        ctx.save();
        ctx.translate(this.x - cam.x, this.y - cam.y);
        ctx.rotate(this.angle + Math.PI/2);
        ctx.drawImage(textures.player, -20, -20, 40, 40);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(12, -3, 24, 6);
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type) {
        Object.assign(this, {x, y, type, hp: type === 'bandit' ? 55 : 40, maxHp: type === 'bandit' ? 55 : 40, speed: type === 'bandit' ? 85 : 140, dmg: type === 'bandit' ? 18 : 25, range: type === 'bandit' ? 300 : 50, cd: 0, vision: 350, alert: false, angle: Math.random() * Math.PI * 2, patrolT: Math.random() * 3, patrolA: Math.random() * Math.PI * 2});
    }
    update(dt) {
        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy);
        if (dist < this.vision) this.alert = true;
        if (this.alert) {
            this.angle = Math.atan2(dy, dx);
            if (dist > this.range * 0.6) {
                const nx = this.x + Math.cos(this.angle) * this.speed * dt;
                const ny = this.y + Math.sin(this.angle) * this.speed * dt;
                if (!collide(nx, this.y, 14)) this.x = nx;
                if (!collide(this.x, ny, 14)) this.y = ny;
            }
            if (this.cd <= 0) {
                if (this.type === 'bandit' && dist < this.range) {
                    const ang = this.angle + (Math.random() - 0.5) * 0.15;
                    bullets.push({x: this.x + Math.cos(this.angle) * 20, y: this.y + Math.sin(this.angle) * 20, vx: Math.cos(ang) * 400, vy: Math.sin(ang) * 400, friendly: false, dmg: this.dmg});
                    this.cd = 1.0;
                    particles.push({x: this.x + Math.cos(this.angle) * 25, y: this.y + Math.sin(this.angle) * 25, c: '#ffaa00', t: 'flash', life: 0.08, max: 0.08});
                } else if (this.type === 'mutant' && dist < this.range) {
                    player.hp -= this.dmg;
                    if (Math.random() < 0.4) player.bleeding = true;
                    this.cd = 0.7;
                    blood.push({x: player.x, y: player.y, a: 1});
                }
            }
        } else {
            this.patrolT -= dt;
            if (this.patrolT <= 0) { this.patrolA = Math.random() * Math.PI * 2; this.patrolT = 2 + Math.random() * 3; }
            const nx = this.x + Math.cos(this.patrolA) * this.speed * 0.25 * dt;
            const ny = this.y + Math.sin(this.patrolA) * this.speed * 0.25 * dt;
            if (!collide(nx, this.y, 14)) this.x = nx;
            if (!collide(this.x, ny, 14)) this.y = ny;
        }
        if (this.cd > 0) this.cd -= dt;
    }
    draw() {
        const sx = this.x - cam.x, sy = this.y - cam.y;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle + Math.PI/2);
        ctx.drawImage(this.type === 'bandit' ? textures.bandit : textures.mutant, -20, -20, 40, 40);
        ctx.restore();
        ctx.fillStyle = '#222'; ctx.fillRect(sx - 18, sy - 30, 36, 5);
        ctx.fillStyle = this.alert ? '#c33' : '#3a3'; ctx.fillRect(sx - 18, sy - 30, 36 * (this.hp / this.maxHp), 5);
    }
}

class Loot {
    constructor(x, y) { Object.assign(this, {x, y, looted: false, amt: 5 + Math.floor(Math.random() * 12), near: false}); }
    update() { this.near = Math.hypot(player.x - this.x, player.y - this.y) < 70; }
    take() { if (!this.looted && this.near) { this.looted = true; player.items += this.amt; return true; } return false; }
    draw() {
        if (this.looted) return;
        const sx = this.x - cam.x, sy = this.y - cam.y;
        ctx.drawImage(textures.crate, sx - TILE/2, sy - TILE/2);
        if (this.near) {
            ctx.fillStyle = '#000'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.fillText('[E] LOOT', sx + 1, sy - TILE/2 - 9);
            ctx.fillStyle = '#ffd700'; ctx.fillText('[E] LOOT', sx, sy - TILE/2 - 10);
            ctx.textAlign = 'left';
        }
    }
}

function collide(x, y, r) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const cx = tx + dx, cy = ty + dy;
            if (cx < 0 || cx >= map.w || cy < 0 || cy >= map.h) continue;
            const t = map.t[cy * map.w + cx];
            if (t === 'wall' || t === 'tree') {
                const l = cx * TILE, t2 = cy * TILE;
                if (x + r > l && x - r < l + TILE && y + r > t2 && y - r < t2 + TILE) return true;
            }
        }
    }
    return false;
}

function genMap() {
    map.t = [];
    for (let i = 0; i < map.w * map.h; i++) map.t.push(Math.random() < 0.6 ? 'grass1' : 'grass2');
    for (let p = 0; p < 8; p++) {
        let px = Math.floor(Math.random() * map.w), py = Math.floor(Math.random() * map.h);
        for (let i = 0; i < 70; i++) {
            if (px >= 0 && px < map.w && py >= 0 && py < map.h) {
                map.t[py * map.w + px] = 'dirt';
                px += Math.floor(Math.random() * 3) - 1;
                py += Math.floor(Math.random() * 3) - 1;
            }
        }
    }
    for (let i = 0; i < 200; i++) {
        const x = Math.floor(Math.random() * map.w), y = Math.floor(Math.random() * map.h);
        if (x > 5 && x < map.w - 5 && y > 5 && y < map.h - 5 && (Math.abs(x - 10) > 6 || Math.abs(y - 10) > 6)) {
            map.t[y * map.w + x] = 'tree';
        }
    }
    for (let b = 0; b < 12; b++) {
        const bx = 10 + Math.floor(Math.random() * (map.w - 22)), by = 10 + Math.floor(Math.random() * (map.h - 22));
        const bw = 4 + Math.floor(Math.random() * 4), bh = 3 + Math.floor(Math.random() * 3);
        for (let y = 0; y < bh; y++) {
            for (let x = 0; x < bw; x++) {
                const tx = bx + x, ty = by + y;
                if (tx < map.w && ty < map.h) {
                    map.t[ty * map.w + tx] = (x === 0 || x === bw - 1 || y === 0 || y === bh - 1) ? 'wall' : 'floor';
                }
            }
        }
        const dx = bx + Math.floor(bw / 2), dy = by + bh - 1;
        if (dx < map.w && dy < map.h) map.t[dy * map.w + dx] = 'door';
        loot.push(new Loot((bx + 1 + Math.random() * (bw - 2)) * TILE, (by + 1 + Math.random() * (bh - 2)) * TILE));
    }
    for (let i = 0; i < 20; i++) loot.push(new Loot((8 + Math.random() * (map.w - 16)) * TILE, (8 + Math.random() * (map.h - 16)) * TILE));
    extract = {x: (map.w - 8) * TILE, y: (map.h - 8) * TILE, r: 120};
}

function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < 15; i++) {
        let x, y; do { x = (10 + Math.random() * (map.w - 20)) * TILE; y = (10 + Math.random() * (map.h - 20)) * TILE; } while (Math.hypot(x - player.x, y - player.y) < 500);
        enemies.push(new Enemy(x, y, 'bandit'));
    }
    for (let i = 0; i < 10; i++) {
        let x, y; do { x = (10 + Math.random() * (map.w - 20)) * TILE; y = (10 + Math.random() * (map.h - 20)) * TILE; } while (Math.hypot(x - player.x, y - player.y) < 500);
        enemies.push(new Enemy(x, y, 'mutant'));
    }
}

function initRain() { rain = []; for (let i = 0; i < 400; i++) rain.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: 500 + Math.random() * 250, l: 15 + Math.random() * 20}); }

function drawMap() {
    const sx = Math.max(0, Math.floor(cam.x / TILE) - 1), sy = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const ex = Math.min(map.w, sx + Math.ceil(canvas.width / TILE) + 2), ey = Math.min(map.h, sy + Math.ceil(canvas.height / TILE) + 2);
    for (let y = sy; y < ey; y++) {
        for (let x = sx; x < ex; x++) {
            const t = map.t[y * map.w + x], px = x * TILE - cam.x, py = y * TILE - cam.y;
            let tex = textures.grass1;
            if (t === 'grass2') tex = textures.grass2;
            else if (t === 'dirt') tex = textures.dirt;
            else if (t === 'floor') tex = textures.floor;
            else if (t === 'wall') tex = textures.wall;
            else if (t === 'door') tex = textures.door;
            if (t !== 'tree') ctx.drawImage(tex, px, py);
            else ctx.drawImage(textures.grass1, px, py);
        }
    }
    for (let y = sy; y < ey; y++) {
        for (let x = sx; x < ex; x++) {
            if (map.t[y * map.w + x] === 'tree') {
                ctx.drawImage(textures.tree, x * TILE - cam.x, y * TILE - cam.y - TILE * 0.5, TILE, TILE * 1.5);
            }
        }
    }
}

function drawBlood() { for (let i = blood.length - 1; i >= 0; i--) { const b = blood[i]; ctx.fillStyle = `rgba(100,20,20,${b.a * 0.6})`; ctx.beginPath(); ctx.arc(b.x - cam.x, b.y - cam.y, 12, 0, Math.PI * 2); ctx.fill(); b.a -= 0.001; if (b.a <= 0) blood.splice(i, 1); } }

function drawRain(dt) { ctx.strokeStyle = 'rgba(150,150,180,0.35)'; ctx.lineWidth = 1; for (const d of rain) { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 8, d.y + d.l); ctx.stroke(); d.x += 150 * dt; d.y += d.s * dt; if (d.y > canvas.height) { d.y = -d.l; d.x = Math.random() * canvas.width; } if (d.x > canvas.width) d.x = 0; } }

function drawHUD() {
    const p = 20;
    ctx.fillStyle = '#111'; ctx.fillRect(p, p, 230, 30);
    ctx.fillStyle = player.bleeding ? '#8a2222' : '#cc3333'; ctx.fillRect(p + 2, p + 2, 226 * (player.hp / player.maxHp), 26);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.fillText('HP', p + 10, p + 21);
    ctx.fillStyle = '#111'; ctx.fillRect(p, p + 36, 230, 24);
    ctx.fillStyle = '#2a8a2a'; ctx.fillRect(p + 2, p + 38, 226 * (player.stam / player.maxStam), 20);
    ctx.fillStyle = '#4f4'; ctx.font = 'bold 14px monospace'; ctx.fillText('>>>', p + 10, p + 53);
    if (player.bleeding) { ctx.fillStyle = '#f33'; ctx.font = 'bold 16px monospace'; ctx.fillText('BLEEDING [F to heal]', p, p + 80); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace';
    ctx.fillText(`AMMO: ${player.ammo}/${player.maxAmmo}`, canvas.width - p, p + 24);
    if (player.reloading) { ctx.fillStyle = '#ff0'; ctx.fillText('RELOADING...', canvas.width - p, p + 50); }
    ctx.fillStyle = '#ffd700'; ctx.fillText(`LOOT: ${player.items}`, canvas.width - p, p + 78);
    const ed = Math.hypot(player.x - extract.x, player.y - extract.y);
    ctx.fillStyle = ed < extract.r ? '#4f4' : '#fff'; ctx.fillText(`EXTRACT: ${Math.floor(ed / 3)}m`, canvas.width - p, p + 106);
    ctx.textAlign = 'left';
    const ms = 170, mx = canvas.width - ms - p, my = canvas.height - ms - p;
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(mx, my, ms, ms);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.strokeRect(mx, my, ms, ms);
    const sx = ms / (map.w * TILE), sy = ms / (map.h * TILE);
    ctx.fillStyle = '#4f4'; ctx.beginPath(); ctx.arc(mx + player.x * sx, my + player.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ff'; ctx.beginPath(); ctx.arc(mx + extract.x * sx, my + extract.y * sy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f44'; for (const e of enemies) if (e.alert) { ctx.beginPath(); ctx.arc(mx + e.x * sx, my + e.y * sy, 3, 0, Math.PI * 2); ctx.fill(); }
}

function drawExtract() {
    const sx = extract.x - cam.x, sy = extract.y - cam.y, pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(68,255,136,${pulse})`; ctx.lineWidth = 4; ctx.setLineDash([14, 7]);
    ctx.beginPath(); ctx.arc(sx, sy, extract.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#4f8'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXTRACT', sx, sy - extract.r - 15); ctx.textAlign = 'left';
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt;
        if (collide(b.x, b.y, 3)) { bullets.splice(i, 1); continue; }
        if (b.friendly) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (Math.hypot(b.x - enemies[j].x, b.y - enemies[j].y) < 22) {
                    enemies[j].hp -= b.dmg; enemies[j].alert = true;
                    blood.push({x: enemies[j].x, y: enemies[j].y, a: 1}); bullets.splice(i, 1);
                    if (enemies[j].hp <= 0) { enemies.splice(j, 1); player.items += 4; }
                    break;
                }
            }
        } else {
            if (Math.hypot(b.x - player.x, b.y - player.y) < 22) {
                player.hp -= b.dmg; if (Math.random() < 0.3) player.bleeding = true;
                blood.push({x: player.x, y: player.y, a: 1}); bullets.splice(i, 1);
            }
        }
        if (b.x < 0 || b.x > map.w * TILE || b.y < 0 || b.y > map.h * TILE) bullets.splice(i, 1);
    }
}

function drawBullets() { ctx.fillStyle = '#ffe066'; for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x - cam.x, b.y - cam.y, 5, 0, Math.PI * 2); ctx.fill(); } }

function updateParticles(dt) { for (let i = particles.length - 1; i >= 0; i--) { particles[i].life -= dt; if (particles[i].life <= 0) particles.splice(i, 1); } }

function drawParticles() { for (const p of particles) { const a = p.life / p.max; if (p.t === 'flash') { ctx.fillStyle = `rgba(255,200,50,${a})`; ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, 20, 0, Math.PI * 2); ctx.fill(); } } }

let lastT = 0;
function loop(t) {
    const dt = Math.min((t - lastT) / 1000, 0.1); lastT = t;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (state === 'menu') drawMenu();
    else if (state === 'play') {
        player.update(dt);
        for (const e of enemies) e.update(dt);
        for (const l of loot) l.update();
        updateBullets(dt); updateParticles(dt);
        cam.x = Math.max(0, Math.min(map.w * TILE - canvas.width, player.x - canvas.width / 2));
        cam.y = Math.max(0, Math.min(map.h * TILE - canvas.height, player.y - canvas.height / 2));
        if (Math.hypot(player.x - extract.x, player.y - extract.y) < extract.r) state = 'win';
        if (player.hp <= 0) state = 'dead';
        drawMap(); drawBlood(); drawExtract();
        for (const l of loot) l.draw();
        for (const e of enemies) e.draw();
        player.draw(); drawBullets(); drawParticles(); drawRain(dt); drawHUD();
    } else if (state === 'win') drawWin();
    else if (state === 'dead') drawDead();
    requestAnimationFrame(loop);
}

function drawMenu() {
    ctx.fillStyle = '#4f4'; ctx.font = 'bold 60px monospace'; ctx.textAlign = 'center';
    ctx.fillText('RAD ZONE', canvas.width / 2, canvas.height / 2 - 130);
    ctx.fillStyle = '#888'; ctx.font = '24px monospace';
    ctx.fillText('An Extraction Shooter', canvas.width / 2, canvas.height / 2 - 80);
    ctx.fillStyle = '#aaa'; ctx.font = '18px monospace';
    ctx.fillText('WASD - Move    Shift - Sprint', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('Mouse - Aim    Click - Shoot', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('R - Reload    E - Loot    F - Heal', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillStyle = '#c33'; ctx.fillText('Reach the EXTRACTION zone!', canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillStyle = '#4f4'; ctx.font = 'bold 28px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 + 170);
    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4f4'; ctx.font = 'bold 60px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillStyle = '#ffd700'; ctx.font = '30px monospace';
    ctx.fillText(`Loot: ${player.items}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = '#4f4'; ctx.font = '24px monospace';
    ctx.fillText('SPACE to play again', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
}

function drawDead() {
    ctx.fillStyle = 'rgba(40,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#c33'; ctx.font = 'bold 60px monospace'; ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillStyle = '#888'; ctx.font = '30px monospace';
    ctx.fillText(`Lost: ${player.items} loot`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = '#c33'; ctx.font = '24px monospace';
    ctx.fillText('SPACE to retry', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
}

function start() {
    player = new Player(10 * TILE, 10 * TILE);
    bullets = []; particles = []; blood = []; loot = [];
    genMap(); spawnEnemies(); initRain(); state = 'play';
}

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && state !== 'play') start();
    if (state === 'play') {
        if (e.key.toLowerCase() === 'r') player.reload();
        if (e.key.toLowerCase() === 'e') for (const l of loot) if (l.take()) break;
        if (e.key.toLowerCase() === 'f') player.heal();
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener('mousedown', () => { mouse.down = true; if (state === 'play') player.shoot(); });
document.addEventListener('mouseup', () => mouse.down = false);
setInterval(() => { if (mouse.down && state === 'play') player.shoot(); }, 120);

initTex();
requestAnimationFrame(loop);
