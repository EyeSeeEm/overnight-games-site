# Station Breach (Alien Breed Mix) - Canvas Iterations

## Initial Build
- Created full game with WASD + mouse aim twin-stick controls
- Implemented 4 weapons: Pistol (infinite ammo), Shotgun, Rifle, Flamethrower
- 3 enemy types: Drone, Brute, Queen (boss)
- 3 levels with procedural room generation
- Blue keycard progression system
- Vision overlay with radial darkness
- Full HUD with health, ammo, minimap, keycards
- Debug overlay (Q key)
- Screen shake and muzzle flash effects
- Floating pickup text feedback
- Room-based enemy spawning (cleared rooms stay cleared)

## Expand Passes (20 required)
1. Added explosive barrels that chain explode and damage enemies/player
2. Added destructible crates that drop health/ammo
3. Added shell casings when shooting (ejected brass)
4. Added persistent blood pools when enemies die
5. Added enemy corpses that remain after death
6. Added interactive terminals in rooms (decoration)
7. Added shield pickups that absorb damage
8. Added medkit pickups that spawn in rooms
9. Added room decorations (pipes, vents, warning stripes)
10. Added kill counter with HUD display
11. Added score system with floating text and HUD
12. Added level-based floor colors (gray/red/purple per level)
13. Added enemy alert indicator (!) when they spot player
14. Added room entry notification showing room name
15. Added dash/dodge ability (Space + direction)
16. Added critical hit chance (15% for 2x damage)
17. Added credits/money drops from enemies
18. Added footstep particles when moving
19. Added different weapon visuals on player sprite
20. Added extended HUD with score, kills, credits display

## Polish Passes (20 required)
1. Fixed minimap position to avoid HUD overlap
2. Added hurt screen flash when taking damage
3. Added low health warning with pulsing red border
4. Improved camera smoothness with adjustable lerp
5. Added weapon switch floating text feedback
6. Improved bullet trails with glow and gradient
7. Added enemy spawn green particles
8. Improved vision cone with subtle flicker (flashlight feel)
9. Improved health bar with gradient colors based on HP
10. Added reload progress bar and ammo warning colors
11. Improved floating text with scale animation and shadow
12. Enhanced menu screen with animated grid and glow effects
13. Improved game over screen with stats box and effects
14. Added dash cooldown indicator
15. Improved stamina bar with label and warning color
16. Better flame projectile visuals (inner/outer flame + smoke)
17. Enhanced muzzle flash particle effect
18. Improved bullet core with outer glow
19. Better wall rendering with highlights and shadows
20. Smoother pickup pulse animation

## Refine Passes (20 required)
1. Classic Alien Breed style HUD at top (1UP, LIVES bar, AMMO bar, KEYS)
2. Updated color palette to match reference (brown-gray industrial)
3. Enhanced wall colors with metallic gray tones
4. Metal grating floor pattern with horizontal lines and rivets
5. More authentic black spider alien (drone) with legs and mandibles
6. Bigger spider aliens (size 40) to match reference
7. Industrial wall textures with panels and corner rivets
8. Large rotating industrial fans like reference
9. Diagonal orange/black warning stripes like reference
10. Warning stripes around doors like reference
11. Bigger orange/yellow muzzle flash like reference
12. Armored soldier player sprite with helmet and visor
13. Darker atmosphere (0.97 darkness) for more tension
14. Metal grating floor with better level-based colors
15. Improved bullet trails with glow effect
16. Better minimap with clearer room distinction
17. Large armored spider brute with glowing red eyes
18. Industrial metal crates with X straps and rivets
19. More fans and decorations in rooms like reference
20. Industrial pipes with joints and highlights

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Mouse aiming
- [x] Shooting toward mouse cursor
- [x] 4 weapons (Pistol, Shotgun, Rifle, Flamethrower)
- [x] Reloading (R key)
- [x] Sprint (Shift)
- [x] 3 enemy types (Drone, Brute, Queen)
- [x] Room-based spawning
- [x] Cleared rooms stay cleared
- [x] Blue keycard progression
- [x] 3 levels
- [x] Queen boss fight
- [x] Health pickups
- [x] Ammo pickups
- [x] Weapon pickups
- [x] Medkit system (H key)
- [x] HUD (health, ammo, minimap)
- [x] Debug overlay (Q key)
- [x] Screen shake
- [x] Muzzle flash
- [x] Vision/darkness system
- [x] Floating text feedback
- [x] Win condition (defeat Queen, escape)
- [x] Death/game over screen
- [x] Pause menu (ESC)

## Post-Mortem
### What Went Well
- Procedural level generation creates interesting layouts
- Vision cone system adds tension and atmosphere
- Combat feels satisfying with screen shake and muzzle flash
- Classic Alien Breed HUD layout matches original well
- Industrial metal grating floor looks authentic
- Spider-like enemy designs match original aesthetic

### What Went Wrong
- Had a duplicate variable declaration bug that caused black screen
- Needed to adjust darkness level several times for balance
- Enemy spawn rate might need tuning for difficulty balance

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~45 minutes
- Polish passes: ~40 minutes
- Refine passes: ~35 minutes
- Total: ~2.5 hours
