# Subterrain - Improvements

## Issues Fixed (Night 9)

### Issue 1: Player basic weapon needs infinite ammo and +10% more range
- **Problem:** Pistol had limited durability (100) and would break. Range was limited.
- **Fix:**
  - Set pistol durability to `Infinity` so it never breaks
  - Increased melee range from 1.5 to 1.65 tiles (+10%)
  - Increased ranged weapon range from 10 to 11 tiles (+10%)
- **Verification:** Pistol now shows infinite durability and attacks hit from further away

### Issue 2: Collision detection for player weapon often misses
- **Problem:** Hit detection used a narrow facing cone (dot product > 0.5, ~60 degrees) which caused many misses.
- **Fix:**
  - Widened facing cone from 0.5 to 0.3 threshold (wider angle acceptance)
  - Increased close-range auto-hit threshold from 1 tile to 2 tiles
- **Verification:** Attacks now land more consistently, especially at close range

### Issue 3: Reduce enemy count in starting rooms by 50%
- **Problem:** STORAGE sector (starting area) had 6 enemies (4 shamblers + 2 crawlers) - too difficult.
- **Fix:** Reduced to 3 enemies (2 shamblers + 1 crawler)
- **Verification:** First sector now has 50% fewer enemies for a more manageable start

## Remaining Issues
- None

## Technical Details
- Pistol durability: Changed from 100 to Infinity in ItemDef
- Melee range: TILE_SIZE * 1.65 (was 1.5)
- Ranged range: TILE_SIZE * 11 (was 10)
- Hit detection dot threshold: 0.3 (was 0.5)
- Close-range auto-hit: TILE_SIZE * 2 (was TILE_SIZE)
- STORAGE enemies: 2 shamblers + 1 crawler (was 4 + 2)
