# Iterations Log: FTL Clone (Canvas)

## Build Info
- **Game:** FTL Clone
- **Framework:** Canvas
- **Agent:** 1
- **Started:** 2026-01-12

---

## Playtest Results Summary

### Iterations 1-8 (Automated Batch)
- **Total Ships Destroyed:** 15
- **Total Jumps:** 34
- **Total Deaths:** 1
- **Max Sector:** 1
- **Successful iterations:** 7/8 (browser crash on iter 2)

### Key Observations

1. **Ship Systems:** Working correctly
   - Shields, weapons, engines, piloting, oxygen, medbay, doors, sensors
   - Power distribution from reactor to systems
   - Systems take damage from weapon hits

2. **Combat System:** Working correctly
   - Weapons charge over time
   - Weapon targeting enemy rooms
   - Damage calculation with shields
   - Enemy ships fire back
   - Shield layers block damage

3. **Sector Map:** Working correctly
   - Beacon navigation
   - Different beacon types (combat, store, distress, exit)
   - Fuel consumption per jump
   - Rebel fleet position tracking

4. **Crew System:** Working correctly
   - Crew can move between rooms
   - Crew man systems for bonuses
   - Crew repair damaged systems

5. **Store System:** Working correctly
   - Buy fuel, missiles, repairs
   - Buy weapons and system upgrades

6. **Resource Management:** Working correctly
   - Scrap for purchases
   - Fuel for jumps
   - Missiles for missile weapons

---

## Features Verified

- [x] Ship room layout with systems
- [x] Power distribution (reactor -> systems)
- [x] Shield layers blocking damage
- [x] Weapon charging and firing
- [x] Weapon targeting enemy rooms
- [x] System damage from hits
- [x] Crew movement
- [x] Crew manning bonuses
- [x] System repair
- [x] Sector map with beacons
- [x] Different beacon types
- [x] Combat encounters
- [x] Store purchases
- [x] Resource collection (scrap, fuel, missiles)
- [x] Evasion calculation
- [x] Multiple enemy ship types
- [x] Victory/defeat conditions

---

## Bugs Fixed

1. **Harness Execute Bug:** Actions weren't being processed correctly
   - Fix: Moved one-time actions outside the animation loop
   - Added continuous weapon firing during execute duration

---

## Known Issues

1. **Browser Stability:** Playwright browser crashes intermittently
2. **Combat Duration:** Long combats against shielded enemies
3. **Balance:** Game difficulty tuned easier for testing

---

*Log updated: 2026-01-12*
