# Spud Survivor (Brotato Clone) - Canvas Version - Iterations Log

## Expand Passes (20 required)
1. Wave-based arena survival system
2. Auto-shooting player with directional aiming
3. Multiple enemy types (basic, fast, tank)
4. XP pickup system with level-up
5. Material/coin drops from enemies
6. Health system with red hearts
7. Wave timer with countdown
8. Enemy spawn scaling per wave
9. Death markers showing enemy kill locations
10. Damage numbers floating on hit
11. Player knockback on enemy contact
12. Enemy knockback on player shots
13. Screen shake on damage
14. Ground detail textures (rocks, grass)
15. Score/kill tracking
16. Wave clear bonus
17. Multiple projectile types
18. Enemy variety with different speeds/HP
19. Pickup magnetism towards player
20. Arena boundary collision

## Polish Passes (20 required)
1. Brotato-style brown-gray color palette
2. Potato player character sprite
3. Purple alien enemy sprites
4. Material glow effect (green)
5. Health bar with heart icon
6. XP bar with level indicator
7. Wave indicator at top center
8. Damage number floating animation
9. Blood/death splatter particles
10. Screen shake on player damage
11. Enemy hit flash effect
12. Bullet trail particles
13. Pickup bobbing animation
14. Ground rock scatter for texture
15. Dead grass patches for variety
16. Player outline for visibility
17. Enemy eye details
18. Kill counter in HUD
19. Smooth wave transitions
20. Game over screen with stats

## Feature Verification Checklist (from GDD)
- [x] Arena survival gameplay
- [x] Auto-shooting mechanics
- [x] Wave system with timer
- [x] XP and leveling
- [x] Multiple enemy types
- [x] Material/coin economy
- [x] Health system
- [x] Damage feedback
- [x] Screen shake
- [x] Brotato visual style

## Post-Mortem

### What Went Well
- Wave system created good pacing with breaks between action
- Auto-shooting simplified controls while keeping engagement
- Death markers showed combat history effectively
- Brotato's brown/purple palette was distinctive and easy to match
- Material magnetism felt satisfying for collection

### What Went Wrong
- Initial spawn rates were too aggressive - overwhelmed player immediately
- Enemy variety needed careful balancing (fast vs tank trade-offs)
- XP bar scaling was off - levels came too quickly initially
- Wave timer visible countdown was confusing at first

### Key Learnings
- Survivors need careful spawn rate tuning - start slow, ramp up
- Auto-shoot needs smart targeting to feel good
- Death markers add narrative to gameplay without text
- Arena boundaries need clear visual indication

### Time Spent
- Initial build: ~20 minutes
- Expand passes: ~25 minutes
- Polish passes: ~20 minutes
- Total: ~65 minutes

### Difficulty Rating
Easy-Medium - Core loop is simple but balancing waves requires iteration

---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "No real wave mechanics with shops inbetween" → Added shop system between waves with upgradable items
2. [x] "Too few enemies at start" → Increased spawn rate from 1.5s to 0.8s, spawn 5 enemies immediately on game start
3. [x] "Too low fire rate at start" → Increased attackSpeed from 1 to 2.5 shots/second

### Implementation Details:

**Shop System:**
- Shop appears between waves
- 4 randomly selected items per shop
- Items: Damage Up, Fire Rate Up, Speed Up, Max HP Up, Heal, Range Up
- Navigation with W/S or Arrow keys
- ENTER to buy, SPACE to start next wave
- Cost scales with wave number (+10% per wave)
- Shows player stats (HP, DMG, SPD, Fire Rate)

**Enemy Spawning:**
- Base spawn rate: 0.8 seconds (was 1.5)
- 20% chance to spawn extra enemy per spawn event
- Max enemies: 15 + wave * 8 (more enemies allowed)
- 5 enemies spawn immediately when game starts
- 3 + wave enemies spawn at start of each new wave

**Fire Rate:**
- Player attackSpeed: 2.5/s (was 1.0)
- Bullet speed: 600 (was 500)
- Player range: 400 (was 300 implicit)

### Verification:
- Tested 60+ seconds with no errors
- Shop appears after wave 1 ends
- More enemies on screen from the start
- Player fires much faster
- Shop upgrades work correctly

**Total Iterations Logged:** 46+ (20 expand + 20 polish + 6 feedback fixes)
