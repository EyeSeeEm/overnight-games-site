# Zero Sievert Clone - Improvements

## Issues Fixed (Night 9)

### Issue 1: Enemies insta-turn and fire - add slight delay before firing
- **Problem:** Enemies would instantly face the player and shoot when entering combat.
- **Fix:**
  - Added `reactionTimer` property to enemies
  - When transitioning to combat: 0.4-0.7s delay from patrol, 0.3-0.5s delay from alert state
  - Enemies cannot shoot until reaction timer expires
  - Added gradual turning (5 rad/s) instead of instant facing
- **Verification:** Enemies now take a moment to react before shooting

### Issue 2: Remove vision cones in front of enemies
- **Problem:** Vision cones were visible in front of enemies.
- **Fix:** Vision cone rendering was already commented out in Enemy.draw() (lines 985-993)
- **Verification:** No vision cones visible during gameplay

### Issue 3: Normal enemies should stand still when firing (only elite enemies move+fire)
- **Problem:** All enemies moved while shooting simultaneously.
- **Fix:**
  - Added `isFiring` state tracking
  - Normal enemies now stand still when in optimal range and shooting
  - Elite enemies (`type === 'elite' || type === 'boss'`) continue to move while firing
- **Verification:** Normal enemies stop to aim and fire, elites remain mobile

### Issue 4: Normal enemies fire too fast - reduce to ~1 shot per second
- **Problem:** Normal enemies had high fire rate, overwhelming the player.
- **Fix:**
  - Added minimum fire interval of 1000ms for normal enemies
  - Elite/boss/sniper enemies retain their faster fire rates
- **Verification:** Normal enemies now shoot approximately once per second

## Remaining Issues
- None

## Technical Details
- Reaction timer: 0.4-0.7s (patrol→combat), 0.3-0.5s (alert→combat)
- Turn speed: 5 radians/second (gradual aim)
- Normal enemy fire interval: max(weaponInterval, 1000ms)
- Elite check: `type === 'elite' || type === 'boss' || behavior === 'sniper'`
