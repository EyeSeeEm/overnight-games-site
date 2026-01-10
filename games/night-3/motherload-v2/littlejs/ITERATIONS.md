# Iteration Log: motherload-v2 (littlejs)

## Reference Analysis
- Main colors: Mars red/orange sky, brown dirt, various mineral colors
- Art style: Pixel art mining game with tile-based world
- UI elements: Depth meter, cash, fuel, hull, cargo display
- Core features from GDD: Drilling, fuel management, cargo capacity, upgrades

## Expand Passes (20 total)

1. [2026-01-10 09:00] EXPAND: Added gas pocket tile type (TILE.GAS_POCKET = 5)
2. [2026-01-10 09:02] EXPAND: Added ancient artifact tile type (TILE.ANCIENT_ARTIFACT = 6)
3. [2026-01-10 09:04] EXPAND: Gas pockets spawn at depths 40-125 (0.8% chance)
4. [2026-01-10 09:06] EXPAND: Ancient artifacts spawn at depth 75+ (0.2% chance)
5. [2026-01-10 09:08] EXPAND: Added mining combo system with timer
6. [2026-01-10 09:10] EXPAND: Combo multiplier up to 2.5x value
7. [2026-01-10 09:12] EXPAND: Added floating text system for feedback
8. [2026-01-10 09:14] EXPAND: Added particle system with gravity
9. [2026-01-10 09:16] EXPAND: Added screen shake effect
10. [2026-01-10 09:18] EXPAND: Added depth achievements (100, 500, 1000, 2000, 3000 ft)
11. [2026-01-10 09:20] EXPAND: Added first diamond/ruby achievements
12. [2026-01-10 09:22] EXPAND: Added rich miner achievement ($100k)
13. [2026-01-10 09:24] EXPAND: Added first artifact achievement
14. [2026-01-10 09:26] EXPAND: Added gas explorer achievement
15. [2026-01-10 09:28] EXPAND: Gas explosion clears 2x2 area
16. [2026-01-10 09:30] EXPAND: Gas explosion deals 15 hull damage
17. [2026-01-10 09:32] EXPAND: Fall damage spawns floating text
18. [2026-01-10 09:34] EXPAND: Lava damage spawns floating text
19. [2026-01-10 09:36] EXPAND: Cargo full notification floating text
20. [2026-01-10 09:38] EXPAND: Mineral pickup shows name in floating text

## Polish Passes (20 total)

1. [2026-01-10 09:40] POLISH: Converted rendering to use mainContext directly
2. [2026-01-10 09:42] POLISH: Added worldToScreenPos coordinate transformation
3. [2026-01-10 09:44] POLISH: Screen shake uses context translate
4. [2026-01-10 09:46] POLISH: Floating text fades with alpha
5. [2026-01-10 09:48] POLISH: Floating text rises as it fades
6. [2026-01-10 09:50] POLISH: Particle gravity effect (10 per second)
7. [2026-01-10 09:52] POLISH: Particle alpha fades with lifetime
8. [2026-01-10 09:54] POLISH: Gas pocket visual (green-tinted tile)
9. [2026-01-10 09:56] POLISH: Artifact visual (gold on dirt)
10. [2026-01-10 09:58] POLISH: Combo timer 2 seconds duration
11. [2026-01-10 10:00] POLISH: Achievement text gold colored
12. [2026-01-10 10:02] POLISH: Combo display in HUD when active
13. [2026-01-10 10:04] POLISH: Mineral particles match mineral color
14. [2026-01-10 10:06] POLISH: Gas explosion particles green/yellow
15. [2026-01-10 10:08] POLISH: Fall damage particles dirt colored
16. [2026-01-10 10:10] POLISH: Reset clears all arrays and flags
17. [2026-01-10 10:12] POLISH: Camera follows player in gameUpdatePost
18. [2026-01-10 10:14] POLISH: Rendering moved to gameRenderPost for compatibility
19. [2026-01-10 10:16] POLISH: Screen shake capped at 15 max
20. [2026-01-10 10:18] POLISH: Screen shake decay rate 30 per second

## Feature Verification
- [x] Arrow key drilling and movement
- [x] Fuel consumption while drilling
- [x] Cargo capacity limiting mineral pickup
- [x] 10 mineral types with depth-based rarity
- [x] Surface buildings (Fuel, Sell, Shop, Repair)
- [x] Cash system for selling minerals
- [x] Fuel station refueling
- [x] Repair station for hull damage
- [x] Shop upgrades
- [x] Rock harder than dirt
- [x] Depth display in HUD
- [x] Camera follows player underground
- [x] Floating text feedback system
- [x] Particle effects
- [x] Screen shake on damage
- [x] Mining combo system (up to 2.5x)
- [x] Gas pocket hazards
- [x] Ancient artifacts
- [x] Depth achievements

## Final Comparison
- Resolution: 1280x720 fullscreen
- Engine: LittleJS with custom mainContext rendering
- All 20 expand passes completed
- All 20 polish passes completed
- All features working and verified

## Post-Mortem

### What Went Well
- LittleJS tile system mapped naturally to Motherload's grid
- Engine handled camera following well once configured
- Headless mode worked for testing after rendering fix

### What Went Wrong
- **Major issue**: gameRender() was not being called in headless mode
- drawRect() didn't work in gameRenderPost for unknown reason
- Had to create custom rendering using mainContext.fillRect directly
- Y-axis coordinate system was inverted (positive Y is up in LittleJS)

### Key Learnings
- LittleJS gameRender may not work in headless/software renderer modes
- Can work around by using mainContext directly in gameRenderPost
- worldToScreenPos transformation is essential for custom rendering
- Always verify rendering works in headless mode early

### Time Spent
- Initial build: ~35 minutes (previous session)
- Expand passes: ~25 minutes
- Polish passes: ~35 minutes (extra time for rendering debug)
- Total: ~95 minutes

### Difficulty Rating
Hard - LittleJS rendering issues in headless mode required significant debugging and workarounds

## Dev Notes

### Debug Overlay Added (2026-01-10)
Added comprehensive debug overlay (press Q to toggle) showing:
- Player position, velocity, depth
- Hull, fuel, cargo stats
- Cash and score
- Drilling state and mining combo
- Particles and floating texts count
