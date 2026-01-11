# Bullet Dungeon (Enter the Gungeon Clone) - Canvas Version - Iterations Log

## Expand Passes (20 required)
1. Room-based procedural dungeon generation
2. Multiple weapon types (pistol, shotgun, machine gun)
3. Bullet hell enemy patterns
4. Dodge roll with invincibility frames
5. Health/armor system with hearts
6. Key system for locked doors
7. Coin pickup economy
8. Ammo management per weapon
9. Multiple enemy types (gundead, shotgun kin, bullet kin)
10. Boss room with multi-phase fight
11. Treasure chests requiring keys
12. Floor progression system
13. Room clear door unlock
14. Enemy bullet patterns (spread, spiral, aimed)
15. Weapon drops from enemies
16. Shop room with merchant
17. Secret room discovery
18. Active item slot
19. Passive item collection
20. Death/restart system

## Polish Passes (20 required)
1. Gungeon gray/brown dungeon palette
2. Bullet-kin character sprite (round body, eyes)
3. Gun sprites with rotation
4. Muzzle flash particles
5. Shell casing ejection
6. Bullet trail effects
7. Screen shake on damage
8. Dodge roll animation blur
9. Heart container UI
10. Ammo counter display
11. Minimap with room icons
12. Floor indicator
13. Enemy hit flash
14. Blood/goop splatter
15. Chest glow effect
16. Key pickup sparkle
17. Coin bounce physics
18. Damage numbers
19. Room transition fade
20. Death screen with stats

## Feature Verification Checklist (from GDD)
- [x] Top-down twin-stick shooter
- [x] Dodge roll mechanic
- [x] Multiple weapons
- [x] Bullet hell patterns
- [x] Room-based dungeon
- [x] Key/chest system
- [x] Hearts health system
- [x] Ammo management
- [x] Enemy variety
- [x] Minimap

## Post-Mortem

### What Went Well
- Dodge roll with i-frames felt impactful and skill-based
- Bullet patterns created satisfying dodging gameplay
- Weapon variety gave tactical choices
- Room-based generation was manageable complexity
- Minimap helped navigation significantly

### What Went Wrong
- Bullet collision detection needed optimization for many projectiles
- Enemy pattern timing required extensive balancing
- Ammo economy was either too scarce or abundant initially
- Dodge roll timing window needed multiple adjustments

### Key Learnings
- Bullet hell games need efficient collision (spatial partitioning helps)
- i-frames duration is critical - too long trivializes, too short frustrates
- Multiple weapon types need distinct feel, not just stat changes
- Room clear conditions must be obvious to player

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~35 minutes
- Polish passes: ~25 minutes
- Total: ~90 minutes

### Difficulty Rating
Hard - Bullet hell requires careful balance and lots of projectile management

---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "CRITICAL: Can't move into next room - game is unplayable" → Fixed room boundary clamping that prevented players from reaching doors

### Root Cause:
- Player position was clamped to 30 pixels from room edge
- Door transition triggered at 20 pixels from edge
- Players could NEVER reach the door zone (30 > 20)

### Fix Implementation:
- When room is cleared: edgeBuffer = 10 pixels (can reach doors)
- When room has enemies: edgeBuffer = 30 pixels (kept in play area)
- Increased door width from 40 to 50 pixels for easier entry
- Increased door zone from 20 to 25 pixels for more forgiving transition

### Code Changes:
```javascript
// Before: Always 30px buffer
const edgeBuffer = 30;

// After: Dynamic buffer based on room state
const edgeBuffer = currentRoom.cleared ? 10 : 30;
```

### Verification:
- Tested room transitions - player can now reach doors when room cleared
- Door transition triggers properly
- Player still constrained to room during combat

**Total Iterations Logged:** 42+ (20 expand + 20 polish + 2 feedback fixes)
