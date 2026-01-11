# Iterations: Binding of Isaac Clone (Basement Tears)

## Session 2026-01-11 - Test Harness Testing and Bug Fixes

### Initial Testing Setup
- Created comprehensive test harness runner (`test-harness-run.js`)
- Used Playwright with headless Chrome for automated testing
- Tests covered: movement, shooting, enemy spawning, combat, door states, player damage, pickup collection, room transitions, invariants, and extended play stability

### Bug 1: `screenShake is not a function` - CRITICAL
- **Problem**: The function `screenShake` was being overwritten with a number in 4 places
- **Root Cause**: Assignment `screenShake = 5` instead of function call `screenShake(5, 0.1)`
- **Solution**: Changed all 4 occurrences from assignment to function call
- **Files Modified**: `game.js`
- **Lines Fixed**:
  - Line 1014: Charger collision with obstacle
  - Line 1057: Monstro boss landing (spawns tears)
  - Line 1085: Enemy `takeDamage` method
  - Line 2551: Bomb explosion in `updateObstacles`
- **Tested**: YES - screenShake now works correctly

### Bug 2: `e.draw is not a function` - Test Infrastructure
- **Problem**: Test script spawned plain objects as enemies, but game expects Enemy class instances with draw() method
- **Root Cause**: Enemy class was not exposed to window for test harness access
- **Solution**: Added exports for game classes to window object:
  ```javascript
  window.Enemy = Enemy;
  window.EnemyTear = EnemyTear;
  window.Tear = Tear;
  window.Player = Player;
  window.ENEMY_DATA = ENEMY_DATA;
  ```
- **Files Modified**: `game.js` (added exports), `test-harness-run.js` (use proper Enemy class)
- **Tested**: YES - proper enemies can now be spawned for testing

### Test Results (Final)

| Test | Status | Details |
|------|--------|---------|
| Harness Loaded | PASS | All harness checks verified |
| Game Started | PASS | Player spawns, game state = playing |
| Movement north | PASS | dy=-67 |
| Movement south | PASS | dy=+67 |
| Movement east | PASS | dx=+67 |
| Movement west | PASS | dx=-67 |
| Shooting north | PASS | Tears created |
| Shooting south | PASS | Tears created |
| Shooting east | PASS | Tears created |
| Shooting west | PASS | Tears created |
| Enemies Spawn | PASS | Start room empty (by design), test spawns work |
| Combat Works | PASS | Killed 1 of 1 enemies |
| Doors Unlock When Clear | PASS | 3 open, 0 closed |
| Player Takes Damage | PASS | HP: 6 -> 5 |
| Pickup Collection | PASS | Coins: 0 -> 1 |
| Room Transition | PASS | Room: (4,4) -> (4,3) |
| All Invariants Pass | PASS | All 7 invariants pass |
| Extended Play Stability | PASS | 30 steps without issues |

**Total: 18/18 tests passing**

### Summary of Changes

1. **Fixed 4 screenShake bugs** - Function was being overwritten instead of called
2. **Exposed game classes** - Enemy, EnemyTear, Tear, Player, ENEMY_DATA now accessible via window
3. **Created test harness runner** - Comprehensive automated testing with Playwright

### Files Modified
- `game.js` - Fixed screenShake calls, added window exports for classes
- `test-harness-run.js` - Created new test runner script

### Verification
- All 18 tests pass
- No JavaScript errors
- Game renders correctly
- All core mechanics work: movement, shooting, combat, damage, pickups, room transitions, doors
