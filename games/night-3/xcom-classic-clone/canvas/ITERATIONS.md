# Iteration Log: X-COM Classic Clone (Canvas)

## Reference Analysis
- Main colors: Dark map, blue soldier armor, grey aliens, dark UI panels
- Art style: Isometric tactical view (authentic X-COM style)
- UI elements: Bottom panel with unit stats, minimap, weapon display
- Core features from GDD:
  - Turn-based tactical combat
  - Time Unit (TU) system
  - Fog of war with line of sight
  - Reaction fire
  - Multiple shot types (snap/aimed/auto)

## 20 EXPAND PASSES

### Expand 1: Isometric Tile System
- 20x20 map grid with isometric conversion
- toIso() and fromIso() coordinate transforms
- TILE_WIDTH=32, TILE_HEIGHT=16 for classic look

### Expand 2: Terrain Types
- Grass (light/dark), Dirt, Road
- Walls (grey/brick), Fence, Bush
- Water, Flowers
- Each with TU cost, cover value, walkability

### Expand 3: Time Unit System
- Soldiers have base TU (50-70 range)
- Movement costs 3-6 TU per tile based on terrain
- Kneeling costs 4 TU, standing costs 8 TU

### Expand 4: Weapon System
- Rifle: 30 damage, snap/aimed/auto modes
- Pistol: 26 damage, snap/aimed modes
- Plasma Pistol: 52 damage, snap/aimed modes
- Each mode with accuracy% and TU% cost

### Expand 5: Soldier Stats
- TU, Health, Stamina, Reactions
- Firing Accuracy, Bravery, Morale
- Random stat generation within ranges

### Expand 6: Alien Types
- Sectoid: 30 HP, grey skin, big eyes
- Floater: 45 HP, brown skin
- Both use Plasma Pistol weapons

### Expand 7: A* Pathfinding
- 8-direction movement with diagonal cost
- Respects terrain walkability
- Calculates total TU cost for path

### Expand 8: Line of Sight
- Bresenham line algorithm
- Walls block visibility
- Vision range based on stance

### Expand 9: Fog of War
- Tiles have visible/explored states
- Soldiers reveal area around them
- Aliens only visible when spotted

### Expand 10: Cover System
- None, Partial, Full cover types
- Partial cover: -30% hit chance
- Full cover: -70% hit chance

### Expand 11: Hit Chance Calculation
- Base: (FiringAccuracy × WeaponAccuracy / 100)
- Modifiers: kneeling +15%, range penalty, cover

### Expand 12: Damage Calculation
- Base damage × random(0.5 to 2.0)
- High variance creates tension

### Expand 13: Reaction Fire
- Compares (Reactions × TU remaining) vs (Target Reactions × TU spent)
- Triggers snap shot on detection

### Expand 14: Alien AI
- Finds nearest visible soldier
- Moves toward if not in range
- Fires when in range with TU available

### Expand 15: Turn System
- Player turn: all soldiers regenerate TU
- Enemy turn: AI controls each alien
- Turn counter increments

### Expand 16: Kneeling Stance
- Toggle with K key
- +15% accuracy bonus
- Costs TU to change stance

### Expand 17: Reload Mechanic
- R key to reload
- Costs 15 TU
- Refills ammo to max

### Expand 18: Victory/Defeat Conditions
- Victory: all aliens killed
- Defeat: all soldiers killed
- Game state changes with overlay

### Expand 19: Projectile System
- Visual projectiles for shots
- Different colors for human/alien
- Travel animation from shooter to target

### Expand 20: Map Generation
- Procedural placement of terrain
- Road through middle
- Landing zone in corner
- Building with brick walls

## 20 POLISH PASSES

### Polish 1: Classic X-COM Color Palette
- GRASS_LIGHT, GRASS_DARK, DIRT variations
- WALL_LIGHT, WALL_BRICK colors
- UI_BG, UI_PANEL, UI_SHADOW colors

### Polish 2: Isometric Tile Rendering
- Diamond-shaped tiles
- Subtle grid lines
- Hover highlight for selected tile

### Polish 3: Wall 3D Effect
- Front face, side face, top face
- Depth shading on walls
- Height of 18 pixels

### Polish 4: Soldier Drawing
- Blue armor with highlights
- Dark helmet with blue visor
- Leg/torso segments
- Weapon held position

### Polish 5: Alien Drawing
- Large head with ellipse shape
- Big black eyes with shine
- Body segment
- Different skins for Sectoid/Floater

### Polish 6: Unit Shadow
- Ellipse shadow under units
- Semi-transparent black

### Polish 7: Selection Arrow
- Yellow arrow above selected unit
- Pulsing visibility indicator

### Polish 8: Health Bar Display
- Shows when unit damaged
- Color changes: green > yellow > red

### Polish 9: Bush Decoration
- Green circles for bushes
- Dark base with lighter top

### Polish 10: Flower Decoration
- Orange flower patches
- Small colored circles

### Polish 11: UI Panel Styling
- 3D beveled edges
- Highlight on top-left
- Shadow on bottom-right

### Polish 12: Stats Bar Display
- TU bar (blue gradient)
- Health bar (green gradient)
- Morale bar (orange gradient)

### Polish 13: Minimap
- Top-left corner
- Color-coded terrain
- Unit positions shown

### Polish 14: Weapon Panel
- Right side display
- Shows current weapon
- Name label

### Polish 15: Turn Indicator
- "YOUR TURN" / "ALIEN TURN"
- Color coded (green/red)

### Polish 16: Unit Count Display
- Soldiers count (blue)
- Known Aliens count (red)

### Polish 17: Message System
- Yellow message text
- Timer-based display
- Combat feedback

### Polish 18: Control Hints
- Bottom text showing keys
- Action descriptions

### Polish 19: Game Over Overlay
- Semi-transparent black
- Victory (green) / Defeat (red)
- Restart prompt

### Polish 20: Projectile Animation
- Plasma green for aliens
- Laser yellow for humans
- Travel from shooter to target

## Feature Verification
- [x] Tile-based isometric map rendering
- [x] Soldier movement with TU costs
- [x] Fog of war (vision system)
- [x] Shooting with snap/aimed/auto modes
- [x] Damage calculation with variance
- [x] Alien AI (patrol, attack)
- [x] Reaction fire system
- [x] Turn system (player/enemy phases)
- [x] Victory/defeat conditions
- [x] 3 weapon types
- [x] 2 alien types
- [x] Kneeling stance
- [x] Cover system
- [x] Reload mechanic
- [x] Unit selection
- [x] A* pathfinding

## Final Comparison
Game achieves authentic X-COM tactical combat aesthetic:
- Isometric view matching classic style
- Blue-armored soldiers vs grey aliens
- Dark UI panels with beveled edges
- TU-based action economy
- Fog of war and line of sight
- Turn-based with reaction fire
- Hit chance with multiple modifiers

## Additional Polish (Iteration 2-3)

### Visual Improvements
1. Enhanced soldier sprites with shoulder pads, knee pads, backpack, detailed armor segments
2. Improved Sectoid aliens with larger heads, almond eyes, thin bodies, arms
3. Improved Floater aliens with jet thrusters, mechanical lower body, face mask
4. Added lamp posts along the road (like reference X-COM screenshots)
5. Added crates near buildings for cover
6. Added debris/rubble decoration
7. Pulsing yellow selection arrow
8. Hit effect particles when projectiles land (orange sparks for hits, grey for misses)
9. Better health bar with border outline

### Gameplay Improvements
1. Increased alien count from 5 to 9 for more tactical challenge
2. Added hit effects system with particle explosions
3. Green plasma effects for alien hits, orange for human hits

## Post-Mortem

### What Went Well
- Isometric coordinate conversion (toIso/fromIso) works reliably
- A* pathfinding handles the grid well
- TU system creates meaningful tactical decisions
- Line of sight with Bresenham algorithm is performant
- Reaction fire adds tension to movement

### What Went Wrong
- Isometric click detection needs careful math
- 3D wall rendering required multiple draw passes
- AI pathfinding could get stuck on complex maps
- Unit selection in crowded areas was tricky

### Key Learnings
- Isometric games need careful layering (back-to-front rendering)
- TU percentage-based shooting balances better than flat costs
- Fog of war exploration state vs visible state distinction important
- Turn-based AI needs clear state machine

### Time Spent
- Initial build: ~35 minutes
- Expand passes: ~45 minutes
- Polish passes: ~35 minutes
- Total: ~115 minutes

### Difficulty Rating
Hard - Isometric rendering and tactical combat mechanics require careful implementation. The TU system, line of sight, and reaction fire all need precise math. Most complex game in the batch.
