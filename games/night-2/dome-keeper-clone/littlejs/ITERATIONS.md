# Iterations: dome-keeper-clone

## Session 2026-01-11

### Fix 1: Multi-directional digging (CRITICAL)
- **Problem**: Player could only dig downward with S key
- **Solution**: Implemented 4-directional drilling in updateMining():
  - W = dig up, S = dig down, A = dig left, D = dig right
  - Drilling occurs when pressing a single direction key facing a solid tile
  - Player automatically moves into cleared tiles after destroying them
- **Files**: game.js (lines 617-734)
- **Tested**: Yes - verified tunnels can be dug in all 4 cardinal directions

### Fix 2: Camera zoom and follow
- **Problem**: Camera was zoomed out too far and barely followed player
- **Solution**: Implemented proper camera system:
  - Camera smoothly follows player with lerp (CAMERA_FOLLOW_SPEED = 0.08)
  - Camera clamps to map bounds
  - During defense phase, camera locks to dome area
- **Files**: game.js (lines 135-142, 601-615)
- **Tested**: Yes - camera follows player deep underground (verified at Depth:28)

### Fix 3: Map size increased 10x
- **Problem**: Map was only 50x35 tiles (~1750 tiles)
- **Solution**: Increased to 80x100 tiles (8000 tiles)
  - Added bedrock boundaries around map edges
  - Dome positioned at top center (DOME_X = 40, DOME_Y = 4)
- **Files**: game.js (lines 12-13, 354-358)
- **Tested**: Yes - verified larger exploration area

### Fix 4: Rock type variety
- **Problem**: Only 4 basic rock types with limited variety
- **Solution**: Added 6 distinct rock types with depth-based distribution:
  | Rock Type | HP | Depth Range | Color |
  |-----------|-----|-------------|-------|
  | Dirt | 2 | 0-50 | Brown |
  | Soft Stone | 4 | 0-50 | Light Gray |
  | Hard Stone | 8 | 20-70 | Gray |
  | Dense Rock | 12 | 40-90 | Dark Gray |
  | Crystal Rock | 16 | 60-100 | Blue |
  | Obsidian | 24 | 80-100 | Purple |

  Resources also spawn based on depth:
  - Iron: Surface to mid-depth
  - Water: Mid-depth onwards
  - Cobalt: Deep areas only
  - Relics: Very deep (50+ tiles)
- **Files**: game.js (lines 50-82, 400-441)
- **Tested**: Yes - verified different rock colors visible at different depths

### Fix 5: Upgrade shop
- **Problem**: No way to spend resources on upgrades
- **Solution**: Enhanced upgrade system:
  - Press E near dome (tile Y < 10) to open upgrade menu
  - 5 upgrade categories: Drill Power, Jetpack Speed, Carry Capacity, Laser Damage, Dome Shield
  - Each upgrade costs Iron + specialty resources (Water/Cobalt for advanced)
  - Visual feedback shows current level, cost, and effects
  - ESC or BACK button to close menu
- **Files**: game.js (lines 496-561, 1141-1215)
- **Tested**: Yes - menu opens, shows costs and levels

### Additional Improvements
- Added depth indicator in HUD
- Added player glow effect
- Added resource glow on ore tiles
- Added drill direction indicator (sparks show which way drilling)
- Capped delta time to prevent physics jumps
- Added "upgrade" sound effect
