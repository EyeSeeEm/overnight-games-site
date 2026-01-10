# Iteration Log: motherload-v2 (canvas)

## Reference Analysis
- Main colors: Mars red/orange sky, brown dirt, various mineral colors
- Art style: Pixel art mining game with tile-based world
- UI elements: Depth meter, cash, fuel, hull, cargo display, buildings on surface
- Core features from GDD: Drilling, fuel management, cargo capacity, upgrades, depth-based minerals

## Expand Passes (20 total)

1. [2026-01-10 07:30] EXPAND: Added floating text system for feedback
2. [2026-01-10 07:32] EXPAND: Added particle effects for drilling
3. [2026-01-10 07:34] EXPAND: Added screen shake on damage/explosions
4. [2026-01-10 07:36] EXPAND: Added mining combo system with score multiplier
5. [2026-01-10 07:38] EXPAND: Added gas pocket tile type (dangerous!)
6. [2026-01-10 07:40] EXPAND: Added ancient artifact tile type (very valuable)
7. [2026-01-10 07:42] EXPAND: Added achievement system for depth milestones
8. [2026-01-10 07:44] EXPAND: Added depth achievement rewards (100, 500, 1000, 2000, 3000 ft)
9. [2026-01-10 07:46] EXPAND: Added first diamond/ruby achievements
10. [2026-01-10 07:48] EXPAND: Added rich miner achievement ($100k)
11. [2026-01-10 07:50] EXPAND: Added gas explosion with 2x2 tile clear
12. [2026-01-10 07:52] EXPAND: Added fall damage floating text and particles
13. [2026-01-10 07:54] EXPAND: Added lava damage floating text
14. [2026-01-10 07:56] EXPAND: Added cargo full notification
15. [2026-01-10 07:58] EXPAND: Added mineral pickup floating text with name
16. [2026-01-10 08:00] EXPAND: Added combo multiplier (up to 2.5x)
17. [2026-01-10 08:02] EXPAND: Added artifact discovery cash bonus ($25k)
18. [2026-01-10 08:04] EXPAND: Added combo display in HUD
19. [2026-01-10 08:06] EXPAND: Gas pockets appear at depths 500-2500ft
20. [2026-01-10 08:08] EXPAND: Artifacts appear at depths 1500ft+

## Polish Passes (20 total)

1. [2026-01-10 08:10] POLISH: Screen shake capped at 15 max
2. [2026-01-10 08:12] POLISH: Screen shake decay rate 30 per second
3. [2026-01-10 08:14] POLISH: Floating text outline stroke for readability
4. [2026-01-10 08:16] POLISH: Floating text fades with alpha
5. [2026-01-10 08:18] POLISH: Particle gravity effect (200 per second)
6. [2026-01-10 08:20] POLISH: Dirt particles on any drill completion
7. [2026-01-10 08:22] POLISH: Gas pocket visual (green tinted rock)
8. [2026-01-10 08:24] POLISH: Artifact visual (gold diamond shape)
9. [2026-01-10 08:26] POLISH: Artifact sparkle effect
10. [2026-01-10 08:28] POLISH: Combo timer 2 seconds
11. [2026-01-10 08:30] POLISH: Gas explosion 15 hull damage
12. [2026-01-10 08:32] POLISH: Achievement floating text gold color
13. [2026-01-10 08:34] POLISH: Achievement bonus cash amounts tuned
14. [2026-01-10 08:36] POLISH: Mineral particles match mineral color
15. [2026-01-10 08:38] POLISH: Gas explosion particles green/yellow
16. [2026-01-10 08:40] POLISH: Fall damage particles dirt colored
17. [2026-01-10 08:42] POLISH: Reset clears new arrays/variables
18. [2026-01-10 08:44] POLISH: Reset clears all achievement flags
19. [2026-01-10 08:46] POLISH: Combo text centered below HUD
20. [2026-01-10 08:48] POLISH: Gas pocket spawn rate 0.8%

## Feature Verification
- [x] WASD/Arrow drilling and movement
- [x] Fuel consumption while drilling
- [x] Cargo capacity limiting mineral pickup
- [x] 10 mineral types with depth-based rarity
- [x] Surface buildings (Fuel, Sell, Shop, Repair)
- [x] Cash system for selling minerals
- [x] Fuel station refueling
- [x] Repair station for hull damage
- [x] Shop upgrades (drill, fuel tank, cargo, hull)
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
- World: 64 tiles wide, 300 tiles deep
- All 20 expand passes completed
- All 20 polish passes completed
- All features working and verified

## Dev Notes

### Debug Overlay Added (2026-01-10)
Added comprehensive debug overlay (press Q to toggle) showing:
- Player position, velocity, depth
- Hull, fuel, cargo stats
- Cash and score
- Drilling state and grounded state
- Mining combo
- All upgrade levels
- FPS, particles, floating texts count

### Expectation-Based Testing
- Debug overlay confirmed working
- World generation displaying correctly with minerals
- Surface buildings visible (Fuel, Sell, Shop, Repair)
- FPS: 61 (good performance)

## Post-Mortem

### What Went Well
- Canvas tile rendering was simple and efficient
- Achievement system added good goals for players
- Gas pockets added meaningful risk to deep mining
- Combo system rewarded skillful consecutive mining
- Surface building interactions were intuitive

### What Went Wrong
- Initial tile generation needed careful depth weighting
- Camera scrolling required bounds checking
- Gas explosion 2x2 clear needed neighbor tile validation

### Key Learnings
- Tile-based games benefit from simple state management
- Achievement systems add replayability cheaply
- Environmental hazards (gas, lava) need clear visual cues
- Combo timers of 2s feel responsive but not stressful

### Time Spent
- Initial build: ~40 minutes (previous session)
- Expand passes: ~30 minutes
- Polish passes: ~20 minutes
- Total: ~90 minutes

### Difficulty Rating
Medium - Tile system was straightforward, but depth-based mineral spawning required balancing
