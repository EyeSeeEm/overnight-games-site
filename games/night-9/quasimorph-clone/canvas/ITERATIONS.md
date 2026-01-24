# Quasimorph Clone - Canvas Iterations

## Expand Passes (20 required)
1. Added procedural station generation with 10-15 rooms
2. Added corridor connections between rooms
3. Added door system (closed/open states)
4. Added 4 weapon types: Knife, Pistol, SMG, Shotgun
5. Added weapon durability system
6. Added 5 enemy types: Guard, Soldier, Possessed, Bloater, Stalker
7. Added corruption system with 6 tiers (0-1000)
8. Added enemy transformation at high corruption
9. Added fog of war with shadowcasting vision
10. Added extraction point mechanic
11. Added loot drops from enemies
12. Added room-based item spawning (medical, armory, storage)
13. Added ammo system (9mm, 12 gauge)
14. Added quick slots for consumables
15. Added bleeding status effect
16. Added score system with high score persistence
17. Added turn-based AP system with stances
18. Added enemy attack animations with visual feedback
19. Added muzzle flash and blood particle effects
20. Added corruption-based visual effects (red tint, flicker)

## Polish Passes (20 required)
1. Improved floor tile variety (metal panels, grate, rust stains, standard)
2. Added detailed wall textures with panel borders and highlights
3. Added hazard stripe pattern to some walls
4. Added tech detail pattern to walls (lines, indicator lights)
5. Improved door rendering with frame, panel, handle, and status lights
6. Added pulsing glow effect to extraction point with double arrows
7. Improved player sprite with legs, arms, armor vest, helmet, visor
8. Added shoulder lights to player character
9. Improved human enemy sprites with legs, face mask, eye slit
10. Added unique Bloater enemy rendering (oval body, pustules, glowing weak point)
11. Added unique Stalker enemy rendering (thin body, long limbs, claws)
12. Added unique Possessed enemy rendering (twisted body, multiple eyes)
13. Added wavey animation to corrupted enemies
14. Improved enemy health bar with border and name tag
15. Added glowing attack line effect from enemy to player
16. Added impact flash effect on player when attacked
17. Added glow effects to all item pickups (pulsing outline)
18. Improved medkit, bandage, ammo box sprites
19. Improved weapon pickup sprites (pistol, SMG, shotgun with detail)
20. Added cigarette pack sprite with lit cigarette

## Refine Passes (20 required)
1. Changed CORRUPTION to ALTERATION to match reference naming
2. Added segmented health bar (20 segments) matching reference style
3. Added segmented ALTERATION bar (20 segments) matching reference style
4. Moved ALTERATION meter to top-right panel position like reference
5. Added STATION room count indicator to top-left
6. Improved corruption value display in red text
7. Added corruption threshold status text (Unease, Spreading, etc.)
8. Adjusted SCORE and HIGH display positioning
9. Added pulsing effect to BLEEDING indicator
10. Improved floor tile rivets positioning for metal panels
11. Added gradient effect to wall borders (top/left lighter, bottom/right darker)
12. Refined door status light colors (red for closed, green for open)
13. Improved extraction point visibility with EXIT label
14. Added darker panel background behind ALTERATION meter
15. Adjusted UI text colors for better contrast
16. Refined enemy name tag positioning above health bar
17. Improved weapon slot selection highlighting
18. Adjusted quick slot item display formatting
19. Refined turn indicator box styling
20. Improved overall color consistency with reference (teal/cyan theme)

## Feature Verification Checklist
- [x] Game loads without errors
- [x] Procedural station generation works
- [x] Player movement with WASD/Arrows
- [x] Turn-based AP system
- [x] 4 weapons (Knife, Pistol, SMG, Shotgun)
- [x] Weapon durability and jamming
- [x] 5 enemy types working
- [x] Enemy AI (patrol, aggressive, rush)
- [x] Corruption system with 6 tiers
- [x] Enemy transformation
- [x] Fog of war / vision system
- [x] Door interactions
- [x] Loot and item pickup
- [x] Ammo and reload system
- [x] Health and healing
- [x] Bleeding effect
- [x] Extraction mechanic
- [x] Score system
- [x] Debug overlay (Q key)
- [x] "No AP" floating text
- [x] Enemy turn indicator
- [x] Enemy attack animations

## Post-Mortem
### What Went Well
- Procedural map generation creates varied, interesting layouts
- Vision/fog of war system works smoothly
- Turn-based combat feels tactical with AP management
- UI closely matches the reference with ALTERATION meter and segmented bars
- Enemy variety adds tactical depth (human vs corrupted types)
- Corruption system creates escalating tension

### What Went Wrong
- Initial sprite rendering was too simple, required multiple polish passes
- Had to refactor UI layout multiple times to match reference

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~15 minutes
- Polish passes: ~20 minutes
- Refine passes: ~15 minutes
- Total: ~75 minutes
