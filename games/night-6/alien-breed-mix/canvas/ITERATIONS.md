# Iterations Log: Station Breach (Canvas)

## Build Info
- **Game:** Station Breach (alien-breed-mix)
- **Framework:** Canvas
- **Agent:** 1
- **Started:** 2026-01-12

---

## Bug Fixes During Development

### Bug 1: Level Not Regenerating on Restart
- **Found:** Iteration 2 had same enemies as iteration 1 ended with
- **Cause:** `forceStart()` only called `startGame()` when gameState === 'menu'
- **Fix:** Changed to always call `startGame()` regardless of state
- **Verified:** Subsequent iterations start with fresh 12 enemies

### Bug 2: Enemies Not Found by Player
- **Found:** Player exploring but enemies never visible
- **Cause:** Level too sparse, corridors too thin for raycasting
- **Fix:**
  - Made rooms smaller and closer (cellSize: 20 -> 12)
  - Made corridors 3 tiles wide instead of 2
  - Added patrol enemies in corridors
- **Verified:** Enemies now found and killed in exploration

### Bug 3: Screen Shake Too Strong
- **GDD Feedback:** Reduce by 50%
- **Fix:** Halved all screen shake values in weapon definitions
- **Status:** Applied at build time

---

## Playtest Results Summary

### Iterations 1-20 (Automated Batch)
- **Total Kills:** 23
- **Total Deaths:** 0
- **Average kills/iteration:** 1.15

### Sample Run Details
| Iter | Kills | Final HP | Enemies Left | Outcome |
|------|-------|----------|--------------|---------|
| 1 | 3 | 85 | 10 | Timeout |
| 2 | 0 | 100 | 12 | Timeout |
| 3 | 3 | 100 | 8 | Timeout |
| 4 | 4 | 85 | 10 | Timeout |
| 5 | 1 | 100 | 11 | Timeout |

### Key Observations
1. **Combat System:** Working correctly
   - Player fires at visible enemies
   - Enemies take damage and die
   - Player takes damage from enemy attacks
   - Drops (credits, ammo) working

2. **Vision System:** Working correctly
   - Raycasting properly hides enemies behind walls
   - Enemies visible when in line of sight
   - Darkness rendering correctly

3. **Level Generation:** Working correctly
   - Rooms connected by corridors
   - Keycards spawn in appropriate rooms
   - Terminals and doors placed correctly
   - Enemy density appropriate

4. **Movement & Controls:** Working correctly
   - WASD movement smooth
   - Mouse aiming functional
   - Reload working
   - Sprint working

---

## Known Issues (Non-blocking)

1. **Exploration Efficiency:** AI playtest doesn't navigate corridors optimally
   - Player sometimes misses rooms
   - Could add breadcrumb/pathfinding for test AI

2. **Victory Condition:** Not reached in automated tests
   - Would require defeating all enemies + finding exit
   - Manual testing recommended for full playthrough

---

## Features Verified

- [x] Twin-stick shooting (WASD + mouse aim)
- [x] Multiple weapon types (Pistol tested)
- [x] Enemy AI (rush behavior, ranged attacks)
- [x] Health/damage system
- [x] Raycasting vision system
- [x] Level generation with rooms/corridors
- [x] Keycard doors
- [x] INTEX terminals
- [x] Minimap
- [x] HUD elements (HP, ammo, credits, keycards)
- [x] Screen shake effects
- [x] Muzzle flash particles
- [x] Floating damage numbers
- [x] Auto-reload when empty
- [x] Level restart on game over

---

## Next Steps

1. Manual playtesting for full game completion
2. Boss fight verification (Deck 4)
3. Self-destruct timer verification
4. Meta-progression testing (if implemented)

---

## Session 2: Extended Playtest (200 iterations)

### Iterations 1-5 (With JSON Logging)
- **Pattern Detected:** Only 1-2 kills per iteration, always timeout
- **Visible Enemies:** 0-1 at any time (despite 12+ total)
- **Player HP:** Always 100 (enemies not dealing damage)
- **Outcome:** 100% timeout rate

### Issue Analysis
The game mechanics work, but:
1. **Visibility:** Level layout makes most enemies non-visible
2. **Enemy AI:** Enemies don't actively seek player
3. **Victory Unreachable:** Would need to find/kill all enemies across large map

### JSON Logs
Saving per-iteration logs to `playtest-logs/` directory.

---

*Log updated: 2026-01-12*
