# Iteration Log: Skyrim 2D (Canvas)

## Reference Analysis
- Main colors: Forest greens, earthy browns, dark UI panel
- Art style: Detailed pixel art (Stoneshard-inspired)
- UI elements: Dark panel at bottom with inventory, health/mana bars, level display
- Core features from GDD:
  - WASD movement, sprint
  - Combat system
  - NPCs with dialogue
  - Quest system
  - Enemies and leveling
  - Items and inventory

## 20 EXPAND PASSES

### Expand 1: Large Tile-Based Map
- 50x50 tile map
- 16px tile size
- Camera follows player

### Expand 2: Terrain Types
- Grass (light/dark variations)
- Dirt, Stone, Snow
- Water, Walls, Trees
- Buildings, Roofs, Paths

### Expand 3: Player System
- Position, health, mana, stamina
- Movement speed, sprint
- Attack state, inventory

### Expand 4: Movement System
- WASD controls
- 8-direction movement
- Collision detection

### Expand 5: Sprint System
- Shift key to sprint
- Stamina drain/regen
- Speed multiplier

### Expand 6: Combat System
- Space to attack
- Attack cooldown
- Damage calculation

### Expand 7: Health/Mana/Stamina
- Regeneration over time
- Displayed in UI bars

### Expand 8: NPC System
- Named NPCs (Guard Captain, Innkeeper)
- Positioned in village
- Dialogue capability

### Expand 9: Dialogue System
- E key to interact
- Dialogue box display
- Response options

### Expand 10: Quest System
- Quest assignment
- Objective tracking
- Completion rewards

### Expand 11: Enemy System
- Enemy AI with aggro range
- Chase behavior
- Attack patterns

### Expand 12: Leveling System
- XP from kills
- Level up thresholds
- Stat increases

### Expand 13: Inventory System
- Item slots (1-3)
- Equipment types
- Hotbar display

### Expand 14: Camera System
- Follows player
- Boundary clamping

### Expand 15: Minimap
- Top-center display
- Shows terrain
- Unit positions

### Expand 16: Village Generation
- Central village area
- Buildings with roofs
- Paths connecting areas

### Expand 17: Forest Generation
- Dense pine forests at edges
- 35% tree density
- Bush and flower placement

## Additional Polish (Testing Iteration)

### Quality Verified
1. Quest system working (Clear the Bandits quest activates)
2. Dialog system working (Innkeeper conversation)
3. NPC interaction with E key
4. Combat with sword swing animation
5. Damage numbers displaying correctly
6. Health/Mana/Stamina bars working
7. Level and XP tracking functional
8. Camera following player smoothly
9. Terrain variety (grass, dirt, snow, water, buildings)

### Expand 18: Biome System
- Snow in north
- Water river on east
- Grassland center

### Expand 19: Farmland
- Crop rows
- Hay bales
- Agricultural areas

### Expand 20: Gold System
- Starting gold (50)
- Enemy drops
- Shop potential

## 20 POLISH PASSES

### Polish 1: Dark Fantasy Palette
- Stoneshard-inspired colors
- Earthy greens, browns
- Dark UI colors

### Polish 2: Tree Rendering
- Multi-layer foliage
- Visible trunks
- Shadow below trees

### Polish 3: Pine Tree Details
- Fuller foliage shapes
- Branch details
- Color variation

### Polish 4: Ground Decoration
- Grass tufts
- Small stones
- Dirt patches

### Polish 5: Building Design
- Brown wooden roofs
- Stone foundations
- Door details

### Polish 6: NPC Sprites
- Colored clothing
- Named labels
- Position marking

### Polish 7: Player Sprite
- Blue outfit
- Directional appearance
- Skin color face

### Polish 8: Enemy Sprites
- Red coloring
- Threat indication

### Polish 9: Water Animation
- Multi-wave effect
- Sparkle highlights
- Color variation

### Polish 10: Snow Particles
- Falling snow in north
- Drift animation
- Size variation

### Polish 11: Campfire Animation
- Flickering flames
- Orange glow
- Light radius

### Polish 12: Health Bar Design
- Red gradient
- Dark background
- Numerical display

### Polish 13: Mana Bar Design
- Blue gradient
- Matching style

### Polish 14: Stamina Bar Design
- Green gradient
- Sprint indicator

### Polish 15: UI Panel Design
- Dark panel (#12141a)
- Border highlights
- Clean layout

### Polish 16: Inventory Slots
- Grid display
- Numbered slots
- Item icons

### Polish 17: Level Display
- Level number
- XP progress
- Gold count

### Polish 18: Control Hints
- WASD, Space, E
- Bottom of UI

### Polish 19: Minimap Styling
- Terrain colors
- Entity markers
- Border frame

### Polish 20: Shadow System
- Tree shadows
- Building shadows
- Soft transparency

## Feature Verification
- [x] WASD movement with collision
- [x] Sprint with stamina drain/regen
- [x] Space to attack
- [x] E to interact with NPCs
- [x] Dialogue system
- [x] Quest system
- [x] Enemy AI chase behavior
- [x] Health/Mana/Stamina bars
- [x] Level and XP system
- [x] Gold tracking
- [x] Inventory slots
- [x] Minimap display
- [x] Dense pine forests (35% density)
- [x] Village with buildings and NPCs
- [x] Farmland with crops
- [x] Animated campfire with glow
- [x] Water animation with waves
- [x] Snow particles in north
- [x] Ground decorations (tufts, stones)
- [x] Dark Stoneshard-style UI

## Final Comparison
Game achieves Stoneshard/Skyrim 2D aesthetic:
- Dense pine forests surrounding central village
- Earthy color palette (browns, greens)
- Dark UI panel at bottom with inventory
- Animated environmental elements (water, fire, snow)
- Top-down RPG with combat, dialogue, quests
- All core mechanics functional

## Post-Mortem

### What Went Well
- Multi-layer terrain rendering creates depth (trees, decorations)
- Particle system (snow, water sparkles) adds atmosphere
- Dark Stoneshard palette feels authentic
- NPC dialogue system works cleanly
- Biome system (snow/water/grass) creates varied world

### What Went Wrong
- 50x50 map needed careful camera bounds
- Tree density at 35% required tuning
- Collision detection with trees needed iteration
- Quest system is basic (could expand)

### Key Learnings
- Dense forests need visible trunks to look natural
- Ground decorations (tufts, stones) add significant polish
- Water animation with multiple wave speeds looks better
- Snow particles only in northern biome adds realism

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~45 minutes
- Polish passes: ~40 minutes
- Total: ~115 minutes

### Difficulty Rating
Medium - Top-down RPG mechanics are straightforward, but achieving the Stoneshard aesthetic required many visual iterations. The multi-biome world with dense forests took time to get right.
