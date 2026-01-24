# Bullets of the Damned (Enter the Gungeon Clone) - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with player movement (8-directional WASD)
2. Added mouse aim system - bullets go toward cursor (CRITICAL)
3. Added shooting mechanics with fire rate and magazine
4. Added dodge roll with i-frames (Space key)
5. Added blanks system (Q key) - clears all enemy bullets
6. Added reload mechanic (R key)
7. Added weapon switching (1-9 number keys)
8. Added 6 weapons: Marine Sidearm, M1911, Shotgun, AK-47, Demon Head, Railgun
9. Added 8 enemy types: Bullet Kin, Bandana Bullet, Shotgun Kin, etc.
10. Added 3 floors: Keep of the Lead Lord, Gungeon Proper, The Forge
11. Added 3 bosses: Bullet King, Beholster, High Dragun
12. Added procedural room generation (7-9 rooms per floor)
13. Added room types: start, shop, chest, combat, boss
14. Added cover objects: pillars, barrels (explosive), crates, tables
15. Added flippable tables (E key) for cover
16. Added door system with room locking during combat
17. Added chest system with key requirements
18. Added shop system with prices (hearts, blanks, keys, ammo)
19. Added pickup system: hearts, ammo, shells
20. Added floor transition screen with stats

## Polish Passes (20 required)
1. Bullet-themed enemy designs with angry faces (per feedback)
2. Added enemy brass casing top (bullet appearance)
3. Added enemy angry eyebrows
4. Added enemy health bars above each enemy
5. Added boss crown design for Bullet King
6. Added boss red glowing eyes
7. Added boss phase system (3-4 phases)
8. Added boss attack patterns: spiral, aimed burst, ring, shotgun
9. Added player Marine sprite with helmet and visor
10. Added player weapon visualization (gun pointing at cursor)
11. Added muzzle flash particles when shooting
12. Added hit particles when bullets connect
13. Added death particles when enemies die
14. Added blank visual effect (expanding circle)
15. Added explosion effect for barrels
16. Added floating damage numbers
17. Added "ROOM CLEARED" notification
18. Added "RELOADING" indicator
19. Added door prompts when near exits
20. Added invincibility visual flash

## Refine Passes (20 required)
1. Matched floor tiles to 50% smaller size (per feedback)
2. Added checkerboard floor pattern for depth
3. Matched wall tiles with border detail
4. Added room object density (3-8 objects per room)
5. Added enemy strafing behavior at close range
6. Added homing bullets for Demon Head weapon
7. Added piercing for Railgun
8. Added shotgun pellet spread
9. Matched HUD layout to ETG style: hearts, armor, blanks, keys, shells
10. Added weapon info panel (name, ammo count)
11. Added floor/room indicator in HUD
12. Added boss health bar at bottom of screen
13. Added boss phase indicator
14. Fixed collision with cover objects
15. Fixed bullet collision with flipped tables
16. Added enemy bullet glow effect
17. Added door color coding (green=unlocked, red=locked)
18. Matched shell currency drops from enemies
19. Fixed room clearing detection
20. Added auto-fire for automatic weapons

## Feature Verification Checklist
- [x] Mouse aim - bullets go toward cursor (CRITICAL)
- [x] 8-directional movement (WASD)
- [x] Dodge roll with i-frames (Space)
- [x] Blanks clear enemy bullets (Q)
- [x] Reload (R key)
- [x] Weapon switching (1-9)
- [x] 6 weapons with different behaviors
- [x] 8 enemy types with bullet theme
- [x] 3 floors with different themes
- [x] 3 bosses with attack patterns
- [x] Procedural room generation
- [x] Cover objects (pillars, barrels, crates, tables)
- [x] Flippable tables (E key)
- [x] Shop system with prices
- [x] Chest system with keys
- [x] Hearts, blanks, keys, shells pickups
- [x] Room locking during combat
- [x] Floor transition screen
- [x] Boss health bar
- [x] Debug overlay (Tab key)
- [x] Victory/Game Over screens
- [x] 50% smaller floor tiles (feedback)
- [x] Room objects for cover (feedback)
- [x] Bullet-themed enemies (feedback)

## Post-Mortem
### What Went Well
- Mouse aim works correctly (bullets go to cursor)
- Dodge roll feels responsive with i-frames
- Bullet-themed enemy designs look authentic
- Room generation with different types works well
- Boss attack patterns create bullet-hell feel
- Cover system adds tactical depth

### What Went Wrong
- Initial room size was too small
- Enemy spawning needed better positioning
- Boss HP needed balancing

### Time Spent
- Initial build: ~50 minutes
- Expand passes: ~40 minutes
- Polish passes: ~35 minutes
- Refine passes: ~30 minutes
- Total: ~155 minutes
