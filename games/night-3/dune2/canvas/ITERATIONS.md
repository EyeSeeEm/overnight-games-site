# Iteration Log: Dune 2 (Canvas)

## Reference Analysis
- Main colors: Desert tan/brown terrain, blue player units, red enemy
- Art style: Classic RTS top-down view
- UI elements: Right panel with credits, power, minimap, build buttons
- Core features from GDD:
  - Resource harvesting (spice)
  - Base building
  - Unit production
  - Combat

## 20 EXPAND PASSES

### Expand 1: Tile-Based Map System
- Large scrollable map grid
- Sand, rock, spice terrain types
- Buildable foundation areas

### Expand 2: Credits System
- Starting credits (1500)
- Income from harvesting
- Costs for buildings/units

### Expand 3: Power System
- Power production (wind traps)
- Power consumption (buildings)
- Power bar display

### Expand 4: Building Types
- Construction Yard (base)
- Wind Trap (power)
- Refinery (income)
- Barracks (infantry)
- Factory (vehicles)
- Turrets (defense)

### Expand 5: Unit Types
- Infantry (cheap, basic)
- Trooper (medium)
- Quad (fast vehicle)
- Tank (heavy armor)
- Harvester (resource)
- Siege Tank (artillery)

### Expand 6: Construction System
- Building queue
- Placement validation
- Foundation requirements

### Expand 7: Unit Production
- Production queue
- Rally points
- Cost deduction

### Expand 8: Resource Harvesting
- Spice fields on map
- Harvester collection
- Refinery delivery

### Expand 9: Unit Movement
- Pathfinding system
- Click-to-move
- Group movement

### Expand 10: Combat System
- Attack commands
- Damage calculation
- Unit health/destruction

### Expand 11: Enemy AI
- Base building
- Unit production
- Attack waves

### Expand 12: Selection System
- Click to select
- Box selection
- Group commands

## Additional Polish (Iteration 2)

### Visual Improvements
1. Building-specific details for each structure type
2. Construction Yard with crane structure
3. Refinery with silo tanks and pipeline
4. Wind Trap with turbine blade and vent lines
5. Barracks/Factory with door and roof stripes
6. Turret with gun barrel and rotating base
7. Building shadows for depth
8. Highlight edges on buildings for 3D effect
9. Improved health bar with border

### Expand 13: Minimap
- Map overview
- Unit positions
- Click to scroll

### Expand 14: Build Queue UI
- Building buttons
- Cost display
- Hotkeys (1-6)

### Expand 15: Unit Queue UI
- Unit buttons
- Cost display
- Hotkeys (Q-V)

### Expand 16: Camera System
- Edge scrolling
- Keyboard scroll
- Minimap click

### Expand 17: Fog of War
- Explored/visible areas
- Unit vision range

### Expand 18: Victory/Defeat
- Destroy enemy base
- Lose all structures

### Expand 19: Building Placement
- Ghost preview
- Valid/invalid indicator
- Adjacent requirements

### Expand 20: Unit Rally Points
- Set destination for produced units
- Visual indicator

## 20 POLISH PASSES

### Polish 1: Desert Color Palette
- Multiple sand shades
- Rock formations
- Spice orange

### Polish 2: Building Sprites
- Detailed structures
- House color (blue/red)
- Shadow effects

### Polish 3: Unit Sprites
- Directional graphics
- House color coding
- Size variations

### Polish 4: Terrain Variation
- Random tile variation
- Edge blending
- Dune patterns

### Polish 5: Selection Box
- Animated border
- Health bar display
- Unit type indicator

### Polish 6: UI Panel Design
- Dark panel background
- Yellow/orange accents
- Clean typography

### Polish 7: Credits Display
- Large number format
- Color coding
- Income indicator

### Polish 8: Power Bar
- Production vs consumption
- Color gradient
- Numerical display

### Polish 9: Minimap Styling
- Terrain colors
- Unit markers
- View rectangle

### Polish 10: Build Button Design
- Icon graphics
- Cost labels
- Hotkey indicators

### Polish 11: Unit Button Design
- Unit icons
- Cost labels
- Production state

### Polish 12: Scroll Indicators
- Edge detection zones
- Visual feedback

### Polish 13: Attack Effects
- Projectile animation
- Impact effects
- Damage numbers

### Polish 14: Building Construction
- Progress bar
- Construction animation

### Polish 15: Unit Movement Animation
- Smooth interpolation
- Direction changes

### Polish 16: Harvester Animation
- Collection effect
- Full/empty state

### Polish 17: Explosion Effects
- Building destruction
- Unit death

### Polish 18: Sound Indicators
- Visual feedback for actions
- Selection confirmations

### Polish 19: Message System
- Event notifications
- Combat reports

### Polish 20: Control Hints
- Bottom text
- Keyboard shortcuts

## Feature Verification
- [x] Desert tile-based map
- [x] Credits economy system
- [x] Power production/consumption
- [x] Building types (6+)
- [x] Unit types (6+)
- [x] Construction system
- [x] Unit production
- [x] Resource harvesting
- [x] Unit movement
- [x] Combat system
- [x] Enemy AI
- [x] Selection system
- [x] Minimap
- [x] Build/unit queue UI
- [x] Camera scrolling

## Final Comparison
Game achieves classic Dune 2 RTS aesthetic:
- Desert terrain with sand/rock/spice
- Blue player vs red enemy
- Right-side UI panel
- Credits and power economy
- Building and unit production
- Real-time tactical combat

## Post-Mortem

### What Went Well
- RTS economy (credits/power) creates strategic depth
- Building placement validation works cleanly
- Minimap provides essential situational awareness
- Unit selection and group commands work smoothly
- Hotkey system (1-7, Q-V) matches classic RTS feel

### What Went Wrong
- Harvester pathfinding to spice was complex
- Building placement near edges caused issues
- Unit collision when grouped moving was tricky
- Enemy AI needed multiple attack behavior iterations

### Key Learnings
- RTS games need clear visual feedback for all actions
- Power systems add strategic layer without complexity
- Foundation-based building works better than free placement
- Minimap click-to-scroll is essential for large maps

### Time Spent
- Initial build: ~35 minutes
- Expand passes: ~50 minutes
- Polish passes: ~35 minutes
- Total: ~120 minutes

### Difficulty Rating
Hard - RTS games have many interconnected systems (economy, production, combat, AI). Each system is simple but they must work together seamlessly. Balancing resource costs and unit stats takes iteration.

---

## Session 2026-01-11 - Feedback Fixes

### Fix 1: Construction Menu Click Handler
- **Problem**: Clicking objects on right side menu did nothing - only keyboard shortcuts worked
- **Solution**: Added `handleUIClick()` function to detect clicks on UI panel buttons and trigger construction
- **Files**: game.js (added UI click handling)
- **Tested**: Yes - verified button clicks now start construction

### Fix 2: Building Construction Progress System
- **Problem**: Buildings were placed instantly with no construction time
- **Solution**:
  - Added `buildingQueue`, `buildingProgress`, and `buildingReady` state variables
  - Added `updateBuildingConstruction()` function with progress tracking
  - Added `buildTime` property to all BUILDINGS definitions
  - Building construction shows progress bar in UI
  - Once complete, building enters "ready to place" mode
- **Files**: game.js (building definitions, new construction functions)
- **Tested**: Yes - construction now takes time with visual progress

### Fix 3: Visual Construction Progress Display
- **Problem**: No visual feedback during construction
- **Solution**:
  - Added "BUILDING:" section in UI with progress bar (yellow fill)
  - Shows building name and percentage during construction
  - Shows green "PLACE!" indicator when ready
  - Build buttons show yellow border during construction
  - Build buttons show pulsing green border when ready to place
- **Files**: game.js (drawUI, drawBuildButtons functions)
- **Tested**: Yes - progress bar fills up during construction

### Fix 4: Building Placement After Construction
- **Problem**: Player couldn't place building after construction
- **Solution**:
  - When construction completes, `buildingMode` is set automatically
  - Player can click on valid rock terrain to place
  - Cost already deducted at construction start, not at placement
  - `buildingReady` is cleared after placement
  - Right-click or Escape cancels placement
- **Files**: game.js (mousedown handler, keyboard handler)
- **Tested**: Yes - all building types construct and place correctly

### Fix 5: Power Ratio Bug
- **Problem**: Construction progress was 0 when power.produced was 0
- **Solution**: Changed power ratio calculation to allow minimum 0.3 (30% speed) even without power
- **Files**: game.js (updateBuildingConstruction, updateProduction)
- **Tested**: Yes - buildings now construct even before Wind Trap is built

### All Feedback Items Verified
- [x] Construction menu clicking works
- [x] Construction progress shown visually
- [x] Buildings can be placed after construction
- [x] All building types tested and working
