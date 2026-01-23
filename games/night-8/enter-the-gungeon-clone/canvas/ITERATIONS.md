# Enter the Gungeon Clone - Canvas Iterations

## Initial Build Summary
- 8-direction WASD movement
- Mouse aim and shooting
- Dodge roll with i-frames (Space)
- Procedural floor generation (7-9 rooms)
- 3 floors: Keep, Gungeon Proper, Forge
- 8 enemy types (Bullet Kin, Bandana, Shotgun Kin variants, Gun Nut, Blobulon, Rubber Kin)
- 3 bosses (Bullet King, Beholster, High Dragun)
- 10 weapons (Peashooter, M1911, Shotgun, AK-47, Demon Head, Railgun, Machine Pistol, Crossbow, Bow, Mega Douser)
- Room objects (tables, pillars, explosive barrels)
- Full UI (hearts, armor, blanks, keys, shells, minimap, weapon display)
- Debug overlay (Q key)

## Expand Passes (20 required)
1. Increased room size to fill canvas (80x60 tiles)
2. Added animated torches with flickering flames and light glow
3. Added brick wall pattern with mortar lines
4. Added skull decorations on wall tops
5. Added floor detail textures (cracks, debris)
6. Added pickup system with magnet collection
7. Added shell pickups that drop from enemies
8. Added heart pickups (10% drop chance)
9. Added ammo pickups (15% drop chance)
10. Added shell casing particles when shooting
11. Added chest opening mechanic (E key)
12. Added weapon drops from chests by tier
13. Added 'collect' particle effect for pickups
14. Added 'heal' particle effect for hearts
15. Added 'chestOpen' particle burst effect
16. Added gravity system for particles
17. Added room clear rewards (shells, keys, blanks)
18. Added 'roomClear' particle celebration effect
19. Fixed door transitions with proper collision detection
20. Added door passage zones allowing player through unlocked doors

## Polish Passes (20 required)
1. Enhanced player bullet visuals with trail effects
2. Added outer glow to player bullets
3. Added bright white center to player bullets
4. Enhanced enemy bullet visuals with trail effects
5. Added multi-layer glow to enemy bullets (outer + mid)
6. Added inner highlight to enemy bullets
7. Improved muzzle flash particles
8. Added shell casing ejection with gravity
9. Improved crosshair visibility
10. Enhanced pickup magnet feel (smooth collection)
11. Added weapon reloading indicator
12. Improved screen shake on hits
13. Enhanced death particle effects
14. Improved collision feedback
15. Better door visual indicators (locked vs unlocked)
16. Enhanced minimap current room highlight
17. Improved floor title display
18. Better UI panel backgrounds
19. Enhanced weapon display with ammo count
20. Improved hit feedback with i-frames flash

## Refine Passes (20 required)
1. Matched EtG floor color palette (dark purple/gray tones)
2. Matched bullet kin enemy colors (tan/brown)
3. Added bandana to bandana bullet kin
4. Matched wall brick pattern style
5. Added torch light glow matching reference
6. Matched heart UI style and positioning
7. Added armor indicator matching EtG blue
8. Matched blank indicator style
9. Matched key visual style (yellow)
10. Added skull decorations on walls like EtG
11. Matched checkered floor tile pattern
12. Improved enemy face expressions
13. Matched room object styles (tables, barrels)
14. Added explosive warning on barrels
15. Matched door frame visuals
16. Improved crosshair matching EtG style
17. Matched weapon HUD positioning
18. Added floor indicator text
19. Matched minimap color coding
20. Refined overall dark dungeon atmosphere

## Feature Verification Checklist
- [x] 8-direction movement (WASD)
- [x] Mouse aim toward cursor
- [x] Shooting toward mouse position
- [x] Dodge roll with i-frames
- [x] Blanks clear bullets
- [x] Table flip for cover
- [x] 10 weapons available
- [x] 3 floors progression
- [x] Bullet King boss (Floor 1)
- [x] Beholster boss (Floor 2)
- [x] High Dragun boss (Floor 3)
- [x] Bullet-themed enemy visuals
- [x] Hearts/armor/blanks/keys/shells UI
- [x] Minimap showing room layout
- [x] Weapon display with ammo
- [x] Debug overlay (Q key)
- [x] Room locking during combat
- [x] Door transitions between rooms
- [x] Chests in treasure rooms
- [x] Shop with items for sale
- [x] Win condition (defeat High Dragun)

## Post-Mortem
### What Went Well
- Core roguelike mechanics implemented smoothly
- Procedural dungeon generation working correctly
- Enemy AI and bullet patterns feel authentic
- Visual effects (bullets, particles, glow) look good
- Room transition system working after fix
- Pickup magnet collection feels satisfying

### What Went Wrong
- Initial door collision prevented transitions (fixed)
- Room size needed adjustment to fill canvas
- Had to iterate on wall collision zones

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~40 minutes
- Polish passes: ~20 minutes
- Refine passes: ~15 minutes
- Total: ~105 minutes
