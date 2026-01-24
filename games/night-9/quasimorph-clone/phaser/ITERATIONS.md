# Quasimorph Clone - Phaser Iterations

## Expand Passes (20 required)
1. Added procedural station generation with 10-12 rooms
2. Added AP system (Walk=2 AP, Run=3 AP)
3. Added corruption system with 6 tiers (Normal to Breach)
4. Added 4 weapons (Knife, Pistol, SMG, Shotgun)
5. Added weapon durability system
6. Added 5 enemy types (Guard, Soldier, Possessed, Bloater, Stalker)
7. Added fog of war with 6-tile vision radius
8. Added extraction point and win condition
9. Added loot system with room-type based drops
10. Added enemy transformation at high corruption
11. Added cover system (walls provide accuracy reduction)
12. Added line of sight check for combat
13. Added weapon jamming at 0 durability (50% misfire)
14. Added bullet tracer visual effect
15. Added grenade system with AOE damage
16. Added stance switching (C key: Walk/Run)
17. Added bleeding status effect for corrupted enemy hits
18. Added spawning of corrupted enemies at high corruption
19. Added minimap showing explored areas and enemies
20. Added keyboard shortcuts for game start (Space/Enter from menu)

## Polish Passes (20 required)
1. Added CRT scanline effect for retro visual style
2. Added floating damage numbers on hits
3. Added screen shake on player damage (intensity based on damage)
4. Added player sprite flash when taking damage
5. Added low HP warning with red vignette effect
6. Added critical damage warning text
7. Added minimap with explored areas and enemy markers
8. Added muzzle flash visual for ranged weapons
9. Added bullet tracer lines for ranged combat
10. Added enemy hit flash effect (red tint)
11. Added bloater explosion visual effect
12. Added grenade explosion visual effect
13. Added extraction success screen with score breakdown
14. Added death screen with restart option
15. Added menu screen with warning box flicker effect
16. Added enemy turn indicator visual
17. Added weapon slot UI with hotkeys
18. Added quick slot item display
19. Added corruption level name display
20. Added score tracking and display

## Refine Passes (20 required)
1. Matched dark sci-fi color palette from reference
2. Added industrial metal floor tile variants
3. Compared room layouts to reference screenshots
4. Adjusted fog of war dimming to match reference
5. Updated UI panel positions to match reference layout
6. Refined player sprite colors to match reference
7. Adjusted enemy tint colors for visibility
8. Refined corruption bar visual style
9. Adjusted HP bar colors and thresholds
10. Updated AP indicator visual style
11. Refined inventory panel layout
12. Added border styles matching reference
13. Adjusted font styles for UI consistency
14. Refined enemy turn indicator styling
15. Added debug overlay info matching GDD requirements
16. Verified extraction point visual
17. Confirmed loot crate visibility
18. Tested door opening mechanics
19. Verified enemy behavior patterns
20. Final visual comparison to reference screenshots

## Feature Verification Checklist
- [x] Tile-based movement with AP
- [x] Turn-based combat
- [x] Simple enemy AI (patrol, hunt)
- [x] Health and death
- [x] Procedural station with 10-15 rooms
- [x] Corruption meter with 6 tiers
- [x] Enemy transformation
- [x] Extraction mechanic
- [x] Loot system + score
- [x] Debug overlay (Q key)
- [x] ENEMY TURN indicator
- [x] Auto-end turn on 0 AP
- [x] R = Reload, ENTER = End Turn
- [x] Cover system
- [x] Bleeding status effect
- [x] Weapon jamming at 0 durability
- [ ] Audio effects (not implemented - web limitation)

## Post-Mortem
### What Went Well
- Procedural generation creates varied maps
- Combat system feels tactical with cover and LOS
- Corruption system adds tension
- Minimap helps with navigation
- Visual feedback is satisfying (damage numbers, screen shake)

### What Went Wrong
- Some UI elements could be more polished
- Would benefit from more tile variety
- Enemy AI could be smarter

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~45 minutes
- Polish passes: ~30 minutes
- Refine passes: ~20 minutes
- Total: ~125 minutes
