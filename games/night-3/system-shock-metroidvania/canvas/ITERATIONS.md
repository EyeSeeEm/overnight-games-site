# Iteration Log: system-shock-metroidvania (canvas)

## Reference Analysis
- Main colors: Dark sci-fi (#0a0a12), metallic grays, purple accent (#8844aa)
- Art style: Pixel metroidvania with sci-fi horror elements
- UI elements: HP bar, energy bar, weapon display, room indicator
- Core features from GDD: Side-scrolling, platforming, melee/ranged combat, room exploration

## Expand Passes (20 total)

1. [2026-01-10 14:00] EXPAND: Added floating text system for damage feedback
2. [2026-01-10 14:02] EXPAND: Added particle system with gravity
3. [2026-01-10 14:04] EXPAND: Added screen shake on damage
4. [2026-01-10 14:06] EXPAND: Added melee combo system with timer
5. [2026-01-10 14:08] EXPAND: Combo multiplier up to 2.5x
6. [2026-01-10 14:10] EXPAND: Added score tracking system
7. [2026-01-10 14:12] EXPAND: Added kill counter display
8. [2026-01-10 14:14] EXPAND: Enemy death spawns particles
9. [2026-01-10 14:16] EXPAND: Enemy death shows score popup
10. [2026-01-10 14:18] EXPAND: Player damage shows floating text
11. [2026-01-10 14:20] EXPAND: Player damage spawns particles
12. [2026-01-10 14:22] EXPAND: Bullet hits spawn impact particles
13. [2026-01-10 14:24] EXPAND: Bullet damage shows floating number
14. [2026-01-10 14:26] EXPAND: SHODAN taunt system with timer
15. [2026-01-10 14:28] EXPAND: Random taunts on enemy kills
16. [2026-01-10 14:30] EXPAND: Taunt on player death
17. [2026-01-10 14:32] EXPAND: Combo display in HUD
18. [2026-01-10 14:34] EXPAND: Critical hit indicator for high combos
19. [2026-01-10 14:36] EXPAND: Score display in HUD center
20. [2026-01-10 14:38] EXPAND: Visual effect helper functions

## Polish Passes (20 total)

1. [2026-01-10 14:40] POLISH: Floating text fades with alpha
2. [2026-01-10 14:42] POLISH: Floating text rises as it fades
3. [2026-01-10 14:44] POLISH: Floating text has drop shadow
4. [2026-01-10 14:46] POLISH: Particle alpha fades with lifetime
5. [2026-01-10 14:48] POLISH: Particle gravity effect (300 units/s)
6. [2026-01-10 14:50] POLISH: Screen shake capped at 1.0 max
7. [2026-01-10 14:52] POLISH: Screen shake decay rate 2 per second
8. [2026-01-10 14:54] POLISH: Combo timer 1.5 seconds duration
9. [2026-01-10 14:56] POLISH: Reset clears all visual effect arrays
10. [2026-01-10 14:58] POLISH: Reset clears score and combo
11. [2026-01-10 15:00] POLISH: SHODAN taunt has fade effect
12. [2026-01-10 15:02] POLISH: Taunt styled in italic purple
13. [2026-01-10 15:04] POLISH: Critical damage text yellow color
14. [2026-01-10 15:06] POLISH: Normal damage text orange color
15. [2026-01-10 15:08] POLISH: Score popup gold colored
16. [2026-01-10 15:10] POLISH: Player damage text red colored
17. [2026-01-10 15:12] POLISH: Combo display shows multiplier
18. [2026-01-10 15:14] POLISH: Screen shake before rendering, restore before UI
19. [2026-01-10 15:16] POLISH: Particles drawn after room, before player
20. [2026-01-10 15:18] POLISH: 12 particles on enemy death

## Feature Verification
- [x] WASD/Arrow platformer movement
- [x] Double jump ability
- [x] Wall jump ability
- [x] Melee attack (J/Z key)
- [x] Ranged shooting (K/X key)
- [x] Weapon cycling (Q key)
- [x] Three weapon types: pipe, minipistol, magnum
- [x] HP and energy system
- [x] Enemy AI: shambler, drone types
- [x] Room-based map system
- [x] SHODAN quotes and taunts
- [x] Floating text feedback
- [x] Particle effects
- [x] Screen shake on damage
- [x] Melee combo system
- [x] Score and kill tracking

## Final Comparison
- Resolution: 1280x720 fullscreen
- Rooms: 40x22 tiles
- Dark sci-fi aesthetic maintained
- All 20 expand passes completed
- All 20 polish passes completed
- All features working and verified

## Post-Mortem

### What Went Well
- Metroidvania movement (double jump, wall jump) felt tight
- SHODAN taunts added thematic flavor
- Combo system rewarded aggressive play
- Room template system made level creation easy
- Dark sci-fi color palette matched reference well

### What Went Wrong
- Room templates were fixed text - harder to edit
- Starting room had no enemies (needed different room for combat testing)
- Collision detection for melee needed careful range tuning

### Key Learnings
- Platformer physics need precise gravity/jump velocity tuning
- Taunts from "villain" add personality cheaply
- Room-based maps with templates scale well
- Metroidvania abilities (double jump) need clear visual feedback

### Time Spent
- Initial build: ~50 minutes (previous session)
- Expand passes: ~30 minutes
- Polish passes: ~25 minutes
- Total: ~105 minutes

### Difficulty Rating
Medium-Hard - Platformer physics and multiple attack types required careful implementation

## Dev Notes

### Debug Overlay Added (2026-01-10)
Added comprehensive debug overlay (press Q to toggle) showing:
- Player position, velocity
- HP, energy, grounded status
- On wall, can double jump, facing direction
- Attacking state, weapon, room
- Enemies, bullets, score, kills
- Combo, FPS, particles, floating texts
