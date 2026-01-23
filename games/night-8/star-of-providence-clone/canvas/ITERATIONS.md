# Star of Providence Clone - Canvas Iterations

## Expand Passes (20 required)

1. Added screen shake system for impacts and explosions
2. Added shop system with buyable items (Health Pack, Ammo, Bombs, Shield, Damage Up)
3. Added weapon pickup drops from cleared rooms
4. Added room decorations (pillars, debris, bones, cracks)
5. Added room hazards (spikes, fire) for floors 2+
6. Added treasure room type with chest pickup
7. Added shield system that absorbs damage before HP
8. Added revenge bullets on ghost death (like original)
9. Added ring-on-death effect for bumper enemies
10. Added fireball AoE explosion damage
11. Added combo system tracking consecutive kills
12. Added magnet effect for debris pickups
13. Added bullet trail particles
14. Added muzzle flash particles on weapon fire
15. Added dash trail visual effect (ghosting)
16. Added animated menu with floating ship
17. Added background star particles on menu
18. Added wave counter tracking combat encounters
19. Added total damage dealt statistic
20. Added rooms explored statistic

## Polish Passes (20 required)

1. Improved enemy HP bars visibility with dark background
2. Improved door indicators with directional arrows
3. Improved weapon color coding in HUD (weapon name matches bullet color)
4. Improved boss HP bar with phase indicator
5. Improved particle system with gravity and variable sizes
6. Improved ghost enemy sprite with skull-like face and eyes
7. Improved blob enemy with highlight reflection
8. Improved turret enemy with tracking barrel and red eye
9. Improved pyromancer enemy with flame animation
10. Improved hermit enemy with hooded sprite and glowing eyes
11. Improved bumper enemy with rotating spikes
12. Improved boss sprites (Chamberlord eye tracks player)
13. Improved Wraithking with animated crown and flowing robe
14. Improved Core Guardian with rotating turret ring
15. Improved focus mode hitbox indicator (filled center dot)
16. Improved shield visual indicator (pulsing ring)
17. Improved invulnerability flashing effect
18. Improved bullet glow effect (outer glow ring)
19. Improved pause menu with run statistics
20. Improved game over/victory screens with full stats

## Refine Passes (20 required)

1. Fixed wall colors to match reference (darker brown #664422)
2. Fixed floor pattern to be darker and more subtle
3. Fixed UI green to match reference (#22cc44)
4. Fixed enemy colors to match reference (ghost cyan, pyro orange)
5. Fixed HUD layout to match reference (weapon box left, multiplier right)
6. Fixed heart display to match reference (green hearts)
7. Fixed bomb display (orange circles after hearts)
8. Fixed minimap to match reference position (bottom right)
9. Fixed door color when locked vs unlocked
10. Fixed player ship shape to match reference (pointed triangle)
11. Fixed engine glow with flicker animation
12. Fixed debris pickup color (yellow/gold)
13. Fixed multiplier display format (X1.0 style)
14. Fixed currency display (G suffix like reference)
15. Fixed boss names to uppercase (CHAMBERLORD style)
16. Fixed upgrade screen layout to match reference style
17. Fixed room type labels (SHOP, BOSS, UPGRADE)
18. Fixed enemy bullet colors to match reference (orange)
19. Fixed player bullet colors to match reference (cyan)
20. Fixed overall darker palette to match reference aesthetic

## Feature Verification Checklist

- [x] Player ship movement (8-directional, smooth 280 px/s)
- [x] Focus mode (slow movement 110 px/s, small hitbox)
- [x] Dash with i-frames (130px distance, 0.4s cooldown)
- [x] Basic shooting (peashooter infinite ammo)
- [x] Health/damage system (4 HP, invulnerability after hit)
- [x] Room transitions (doors in 4 directions)
- [x] Weapon switching (1-6 keys)
- [x] Ammo system (500 ammo pool)
- [x] 6 weapons (Peashooter, Vulcan, Laser, Fireball, Revolver, Sword)
- [x] 3 weapon keywords (Homing, Triple, High-Caliber)
- [x] 10 enemy types with unique behaviors
- [x] Enemy attack patterns (burst, spread, fireball, spawn)
- [x] Debris drops and multiplier system
- [x] Boss state machine (3 phases)
- [x] 3 bosses (Chamberlord, Wraithking, Core Guardian)
- [x] Boss attack patterns (ring, spread, spiral, laser sweep)
- [x] Phase transitions with invulnerability
- [x] Victory rewards (+2 HP or +15% DMG)
- [x] Procedural floor generation
- [x] Room types (normal, shop, upgrade, boss, treasure)
- [x] Minimap display
- [x] Floor progression (3 floors to victory)
- [x] Shop system with buyable items
- [x] Shield system
- [x] Bomb system (clears bullets, damages enemies)
- [x] Debug overlay (Q key) with all stats
- [x] Map overlay (Tab key)
- [x] Pause menu (Escape key)
- [x] Combo tracking system
- [x] Statistics tracking (kills, damage, rooms)

## Post-Mortem

### What Went Well
- Core bullet-hell mechanics feel responsive and satisfying
- Boss fights have good phase transitions and escalating difficulty
- Room generation creates varied layouts each run
- Visual style successfully captures the dark sci-fi aesthetic of the original
- Weapon variety provides different playstyles
- Shop system adds strategic depth
- Debug overlay invaluable for testing

### What Went Wrong
- Initial enemy spawning logic had issues with start room
- Boss attack patterns needed multiple iterations to balance
- Particle system initially too heavy on performance
- Room transitions needed careful player repositioning

### Time Spent
- Initial build: ~45 minutes
- Expand passes: ~40 minutes
- Polish passes: ~35 minutes
- Refine passes: ~30 minutes
- Testing and fixes: ~20 minutes
- Total: ~170 minutes (2h 50m)

## Technical Notes

### Controls
- WASD/Arrows: Move
- Space/Click: Fire
- Shift: Focus mode (slow, small hitbox)
- Z: Dash (i-frames)
- X: Bomb
- 1-6: Switch weapons
- Tab: Map overlay
- Q: Debug overlay
- Escape: Pause

### GDD Features Implemented
All MVP features from the GDD have been implemented:
- 3 floors (Excavation, Archives, Maintenance)
- Starting room empty/safe
- Room transitions with door locks
- Level permanence (cleared rooms stay cleared)
- 1 ship (Null Ship)
- 6 weapons with 3 keywords
- Dash, Bombs, Focus mode
- Multiplier system
- 3 bosses (1 per floor)
- Win condition: Defeat floor 3 boss
