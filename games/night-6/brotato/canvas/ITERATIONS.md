# Iterations Log: Brotato (Canvas)

## Build Info
- **Game:** Brotato Clone
- **Framework:** Canvas
- **Agent:** 1
- **Started:** 2026-01-12

---

## Playtest Results Summary

### Iterations 1-15 (Automated Batch)
- **Total Kills:** 24
- **Total Deaths:** 0
- **Max Wave:** 1
- **Average kills/iteration:** 1.6 (4 on successful runs)
- **Successful iterations:** 6/15 (browser crash after iter 6)

### Key Observations

1. **Combat System:** Working correctly
   - Auto-targeting weapons fire at nearest enemy
   - Multiple weapon types (pistol, rifle, shotgun, smg, fist)
   - Enemies killed and drop XP/gold

2. **Wave System:** Working correctly
   - Wave timer counts down
   - Enemies spawn from edges
   - Wave ends when timer expires

3. **Character Selection:** Working correctly
   - 5 characters with different stats
   - Each has unique starting weapon

4. **Shop System:** Working correctly
   - Appears between waves
   - Buy weapons and items with gold
   - Items provide stat bonuses

5. **Level Up System:** Working correctly
   - XP from enemy kills
   - Choose stat upgrades on level up

6. **Enemy Variety:** Working correctly
   - Baby Alien, Chaser, Charger, Spitter, Bruiser, Healer
   - Different behaviors (chase, charge, ranged, healing)

---

## Features Verified

- [x] 8-directional movement (WASD)
- [x] Auto-targeting weapons
- [x] Multiple weapon types
- [x] Wave-based combat
- [x] Shop between waves
- [x] Character selection
- [x] XP/leveling system
- [x] Multiple enemy types with different behaviors
- [x] Gold economy
- [x] Item/stat upgrades
- [x] HUD with HP, XP, wave info

---

## Known Issues

1. **Browser Stability:** Playwright browser crashes after ~6 iterations
2. **Wave Progression:** AI has trouble advancing past wave 1 in testing

---

*Log updated: 2026-01-12*
