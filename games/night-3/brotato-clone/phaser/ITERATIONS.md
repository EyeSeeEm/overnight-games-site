# Spud Survivor (Brotato Clone) - Phaser Version - Iterations Log

## Expand Passes (20 required)
1. Wave-based arena survival with Phaser arcade physics
2. Auto-shooting player with angle calculation
3. Multiple enemy types using Phaser groups
4. XP pickup system with physics overlap
5. Material drops with bounce physics
6. Health system with damage calculation
7. Wave timer using Phaser time events
8. Enemy spawn scaling with wave number
9. Death markers as static sprites
10. Floating damage text with tweens
11. Player knockback using velocity
12. Enemy knockback on projectile hit
13. Camera shake on damage
14. Procedural ground textures
15. Score tracking in scene data
16. Wave clear detection
17. Bullet group with recycling
18. Enemy data configuration object
19. Pickup magnetism with distance check
20. World bounds collision

## Polish Passes (20 required)
1. Brotato color palette constants
2. Procedural potato sprite generation
3. Purple alien enemy textures
4. Material glow with graphics
5. Health bar UI with setScrollFactor(0)
6. XP bar with fill animation
7. Wave text at screen top
8. Damage number tween animation
9. Particle emitter for deaths
10. Camera shake integration
11. Enemy tint on hit
12. Bullet graphics with glow
13. Pickup scale tween (bob)
14. Ground detail sprites
15. Grass/rock scatter
16. Player stroke outline
17. Enemy eye circles
18. Kill counter text
19. Smooth scene transitions
20. Game over overlay

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
- Phaser's group system made enemy/bullet pooling efficient
- Tween system created smooth UI animations
- Physics overlap simplified pickup collection
- Camera shake was one-line implementation
- Particle emitters added juice with minimal code

### What Went Wrong
- Initial physics bodies were too large - caused false collisions
- Group recycling needed manual reset of sprite properties
- Wave timer needed careful time event management
- setScrollFactor(0) wasn't applied to all HUD elements initially

### Key Learnings
- Phaser groups + physics = efficient entity management
- Tweens are powerful for UI feedback
- Always setScrollFactor(0) on HUD immediately
- Test physics body sizes visually with debug mode

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~25 minutes
- Polish passes: ~20 minutes
- Total: ~70 minutes

### Difficulty Rating
Easy-Medium - Phaser handles most complexity, just need to configure properly


---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "No wave mechanics (game doesnt progress through multiple waves)"
   → Wave progression was working, but no break between waves
   → Added ShopScene that appears between each wave
   → Enemies cleared when wave ends

2. [x] "No shop between waves"
   → Created ShopScene with 4 purchasable upgrades:
     - +10 Max HP (15 materials)
     - +3 Damage (20 materials)
     - +0.2 Attack Speed (25 materials)
     - Heal Full HP (10 materials)
   → Player stats persist between waves
   → Continue button and Space key to proceed

3. [x] "Waaaay too many enemies right from wave 1"
   → Reduced max enemies from (50 + wave*5) to (5 + wave*3)
   → Wave 1 now has max 8 enemies instead of 55
   → Spawn rate slowed from 1.5s to 3.0s at start

4. [x] "Fire rate too high"
   → Reduced initial attackSpeed from 1.0 to 0.6
   → Now fires ~1.7 seconds between shots instead of 1.0
   → Can upgrade fire rate in shop

### Verification:
- Game loads without errors
- Wave 1 spawns reasonable number of enemies
- Shop appears after wave ends
- Stats persist between waves

