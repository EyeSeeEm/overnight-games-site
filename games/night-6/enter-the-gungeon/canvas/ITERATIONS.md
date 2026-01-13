# Iterations Log: Enter the Gungeon (Canvas)

## Build Info
- **Game:** Enter the Gungeon Clone
- **Framework:** Canvas
- **Agent:** 1
- **Started:** 2026-01-12

---

## Playtest Results Summary

### Iterations 1-20 (Automated Batch)
- **Total Kills:** 14
- **Total Deaths:** 8
- **Max Floor:** 1
- **Average kills/iteration:** 0.7 (1.4 on successful runs)
- **Successful iterations:** 10/20 (browser crash after iter 10)

### Key Observations

1. **Combat System:** Working correctly
   - Player bullets fire and hit enemies
   - Mouse aiming functional
   - Enemy bullet patterns (single, spread, cardinal)
   - Enemies die and drop shells/ammo

2. **Dodge Roll Mechanics:** Working correctly
   - Space triggers dodge roll
   - I-frames during first half of roll
   - Roll direction based on movement keys

3. **Room System:** Working correctly
   - Procedural room generation
   - Room transitions via doors
   - Entrance, combat, treasure, shop, boss rooms
   - Doors unlock when room cleared

4. **Bullet-Hell Mechanics:** Working correctly
   - Enemy bullets tracked separately
   - Multiple bullet patterns per enemy type
   - Blank system clears bullets

5. **Cover System:** Working correctly
   - Crates and barrels as cover
   - Barrels explode damaging nearby enemies
   - Cover blocks enemy bullets

---

## Features Verified

- [x] 8-directional movement (WASD)
- [x] Mouse aiming
- [x] Click to shoot
- [x] Dodge roll with i-frames
- [x] Blanks (Q key)
- [x] Multiple enemy types (bullet_kin, bandana_kin, shotgun_kin, etc.)
- [x] Enemy bullet patterns
- [x] Procedural floor generation
- [x] Room transitions
- [x] Cover objects (crates, barrels)
- [x] Chest system
- [x] Boss (Bullet King)
- [x] HUD with hearts, blanks, keys, shells
- [x] Minimap

---

## Bugs Fixed

1. **Room Transition Bug:** Door position calculation was incorrect
   - Fix: Corrected door position based on dx/dy direction between rooms
   - Added door positions to getState for AI navigation

---

## Known Issues

1. **Browser Stability:** Playwright browser crashes after ~10 iterations
2. **Difficulty:** Game is challenging (bullet-hell)
3. **Floor Progression:** AI rarely advances to floor 2 due to difficulty

---

*Log updated: 2026-01-12*
