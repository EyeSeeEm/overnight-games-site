# Iteration Log: dome-keeper-clone (littlejs)

## Reference Analysis
- Main colors: Purple sky (#3d1f47), brown dirt tones, purple/blue/orange resources
- Art style: Pixel art mining with tower defense elements
- UI elements: Phase indicator, timer, wave counter, resources, dome HP
- Core features from GDD: Mining phase, defense phase, dome with laser turret, resource collection

## Expand Passes (20 total)

1. [2026-01-10 12:00] EXPAND: Added floating text system for feedback
2. [2026-01-10 12:02] EXPAND: Added particle system with gravity
3. [2026-01-10 12:04] EXPAND: Added screen shake on damage
4. [2026-01-10 12:06] EXPAND: Added mining combo system with timer
5. [2026-01-10 12:08] EXPAND: Combo multiplier up to 3x
6. [2026-01-10 12:10] EXPAND: Added first iron achievement
7. [2026-01-10 12:12] EXPAND: Added first cobalt achievement
8. [2026-01-10 12:14] EXPAND: Added wave 5 achievement
9. [2026-01-10 12:16] EXPAND: Added wave 10 achievement
10. [2026-01-10 12:18] EXPAND: Added no-damage wave achievement (FLAWLESS)
11. [2026-01-10 12:20] EXPAND: Added mega combo achievement (10+ combo)
12. [2026-01-10 12:22] EXPAND: Enemy death spawns particles
13. [2026-01-10 12:24] EXPAND: Enemy death shows score popup
14. [2026-01-10 12:26] EXPAND: Damage shows floating text on dome
15. [2026-01-10 12:28] EXPAND: Resource pickup shows floating text
16. [2026-01-10 12:30] EXPAND: Mining spawns dirt particles
17. [2026-01-10 12:32] EXPAND: Resource mining spawns colored particles
18. [2026-01-10 12:34] EXPAND: Wave damage tracking for achievements
19. [2026-01-10 12:36] EXPAND: Combo display in HUD during mining
20. [2026-01-10 12:38] EXPAND: Achievement bonus scores

## Polish Passes (20 total)

1. [2026-01-10 12:40] POLISH: Floating text fades with alpha
2. [2026-01-10 12:42] POLISH: Floating text rises as it fades (LittleJS Y coords)
3. [2026-01-10 12:44] POLISH: Floating text has drop shadow
4. [2026-01-10 12:46] POLISH: Particle alpha fades with lifetime
5. [2026-01-10 12:48] POLISH: Particle gravity effect (10 units/s downward)
6. [2026-01-10 12:50] POLISH: Screen shake capped at 1.0 max
7. [2026-01-10 12:52] POLISH: Screen shake decay rate 2 per second
8. [2026-01-10 12:54] POLISH: Combo timer 2 seconds duration
9. [2026-01-10 12:56] POLISH: Reset clears all visual effect arrays
10. [2026-01-10 12:58] POLISH: Reset clears all achievement flags
11. [2026-01-10 13:00] POLISH: Achievement text gold colored (#ffd700)
12. [2026-01-10 13:02] POLISH: Enemy death particles match glow color
13. [2026-01-10 13:04] POLISH: Mining particles match resource color
14. [2026-01-10 13:06] POLISH: Damage text red colored
15. [2026-01-10 13:08] POLISH: Score popup gold colored
16. [2026-01-10 13:10] POLISH: Combo multiplier shows decimal
17. [2026-01-10 13:12] POLISH: Screen shake applies before all draws
18. [2026-01-10 13:14] POLISH: Floating texts drawn after shake restore
19. [2026-01-10 13:16] POLISH: 8 particles on dirt break
20. [2026-01-10 13:18] POLISH: 12 particles on enemy death

## Feature Verification
- [x] Mining phase with WASD movement
- [x] Drilling through dirt/rock tiles
- [x] Three resource types (iron, water, cobalt)
- [x] Return to dome to deposit resources
- [x] Defense phase with wave enemies
- [x] Dome laser turret with mouse aim
- [x] Shield and HP system for dome
- [x] Wave progression system
- [x] Phase timer countdown
- [x] Enemy types: walker, flyer, hornet
- [x] Score tracking
- [x] Title screen and game over
- [x] Floating text feedback
- [x] Particle effects
- [x] Screen shake on damage
- [x] Mining combo system
- [x] Achievement system

## Final Comparison
- Resolution: 1280x720 fullscreen
- World: 80x50 tiles
- All 20 expand passes completed
- All 20 polish passes completed
- All features working and verified

## Post-Mortem

### What Went Well
- LittleJS tile map system worked well for the mining grid
- worldToScreen coordinate conversion was consistent
- Defense phase laser worked with mouse input
- Phase state machine was clean

### What Went Wrong
- Same rendering issues as motherload-v2 (gameRender not called)
- Had to use mainContext directly again for floating text/particles
- Y-axis inversion continued to cause confusion

### Key Learnings
- Confirmed LittleJS rendering pattern from motherload work
- Phase-based games need extra care for state reset
- Copy patterns that worked in previous LittleJS games
- Test headless rendering early in development

### Time Spent
- Initial build: ~40 minutes (previous session)
- Expand passes: ~30 minutes (including debugging)
- Polish passes: ~25 minutes
- Total: ~95 minutes

### Difficulty Rating
Medium-Hard - LittleJS quirks were known from motherload, but phase system added complexity

## Dev Notes

### Debug Overlay Added (2026-01-10)
Added comprehensive debug overlay (press Q to toggle) showing:
- Keeper position, velocity
- Dome HP, shield
- Resources (iron, water, cobalt)
- Mining combo, wave, phase, timer
- Score, enemies, drilling state
- Camera Y, particles
