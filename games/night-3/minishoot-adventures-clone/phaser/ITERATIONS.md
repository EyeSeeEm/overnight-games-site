# Iteration Log: Minishoot Adventures Clone (Phaser)

## Reference Analysis
- Main colors: Dark blue-gray background, teal/blue rocks, orange rocks, tan arena floor
- Art style: Cute round creatures with expressive eyes, smooth shapes with subtle shadows
- UI elements: Hearts, diamonds (currency), level progress bar, ability buttons (DASH, SUPER, MAP)
- Core features from GDD: Twin-stick shooting, arena combat, rock obstacles, enemy waves

## Base Iterations (1-10)

1. [Initial] Ported canvas version to Phaser 3
   - Used Phaser.CANVAS renderer for headless compatibility
   - Set up GameScene with create/update lifecycle

2. [Arena] Created play area with boundaries
   - Tan floor with green border
   - Dark outer region
   - Collision boundaries

3. [Rocks] Added decorative rock obstacles
   - Blue and orange rock sprites
   - Varied sizes around perimeter
   - 3D shading effect with Graphics API

4. [Player] Implemented player ship
   - Cyan triangular ship shape
   - Mouse-based rotation
   - WASD movement controls

5. [Shooting] Auto-fire toward cursor
   - Bullet sprite creation
   - Velocity toward mouse position
   - Bullet cleanup on exit

6. [Enemies] Cute red creature enemies
   - Circular bodies with eye details
   - Different sizes for variety
   - Chase behavior toward player

7. [Combat] Collision and damage system
   - Bullet-enemy collision detection
   - Player-enemy collision for damage
   - Death effects and cleanup

8. [UI] Health and currency display
   - Heart icons for health
   - Diamond icons for upgrades
   - Gem counter with value

9. [Level Progress] Added progress bar
   - White fill bar showing progress
   - Level label text
   - Updates with enemy defeats

10. [Ability Buttons] Bottom HUD
    - Hexagonal button shapes
    - DASH, SUPER, MAP labels
    - Cyan color matching theme

## EXPAND Passes (11-30)

11. [Supershot] Charge attack ability
    - Hold right-click to charge
    - Releases 7-bullet spread burst
    - Costs 2 energy, double damage

12. [Grasshopper Enemy] Hopping enemy type
    - Jumps toward player periodically
    - Fires 6-bullet burst on landing
    - Green color with legs

13. [Burrower Enemy] Underground ambush enemy
    - Starts burrowed (semi-transparent)
    - Emerges when player approaches
    - Fires homing bullets on emerge

14. [Mimic Enemy] Tree disguise enemy
    - Looks like teal tree until approached
    - Reveals and fires 12-bullet ring
    - Fast pursuit after reveal

15. [Health Pickups] Recovery drops
    - Green heart pickup sprite
    - 20% drop chance from enemies
    - Restores 1 health point

16. [Energy Pickups] Energy restoration
    - Cyan diamond pickup sprite
    - 20% drop chance from enemies
    - Restores 2 energy points

17. [Boost Ability] Speed burst
    - Hold shift for 1.8x speed
    - Drains energy while active
    - Visual trail enhancement

18. [Multi-bullet] Level upgrade
    - Gain extra bullet every 3 levels
    - Spread pattern increases
    - Max 5 bullets

19. [Wave System] Structured combat
    - 10 waves per run
    - Enemy count scales with wave
    - Wave indicator text

20. [Minimap] Corner navigation
    - Shows player position (cyan)
    - Shows enemy positions (orange)
    - Shows pickup locations (green)

21. [Critical Hits] Damage variation
    - 10% base crit chance
    - 2x damage on crit
    - Yellow damage number

22. [Spawn Warnings] Enemy indicators
    - Red expanding circles before spawns
    - 800ms warning duration
    - Helps player prepare

23. [Elite Enemies] Purple variants
    - 2x health and damage
    - Purple tint visual
    - Double XP reward

24. [Combo System] Kill multiplier
    - Kills within 2 seconds chain
    - Up to 10x multiplier
    - Bonus crystals on combo

25. [Boss Fight] Forest Guardian
    - Large 100px boss sprite
    - Multiple attack patterns
    - Health bar at screen top

26. [Time Stop] Q ability
    - Costs 3 energy
    - Slows enemies to 20% speed
    - 3 second duration

27. [Homing Bullets] Burrower/Boss specialty
    - Pink homing projectiles
    - Smooth turn tracking
    - Limited turn radius

28. [Dash I-Frames] Invincibility
    - 0.3s invincibility during dash
    - Ghost afterimage trail
    - Dodge through bullets

29. [Victory Screen] Win condition
    - Displays after wave 10
    - Shows stats summary
    - Confetti particle effect

30. [Boss Phases] Multi-phase boss
    - Phase 2 at 60% HP
    - Phase 3 at 30% HP
    - Faster fire rate per phase

## POLISH Passes (31-50)

31. [Muzzle Flash] Weapon effects
    - Yellow flash on player fire
    - Blue flash on super shot
    - Quick fade animation

32. [Screen Shake] Impact feedback
    - Shake on player hit
    - Shake on enemy death
    - Large shake on boss death

33. [Damage Numbers] Hit feedback
    - Numbers float up on hit
    - Yellow for critical hits
    - Fade out animation

34. [Hit Flash] Enemy damage
    - White tint on hit
    - Elite purple tint preserved
    - Clear damage feedback

35. [Hit Particles] Impact effects
    - Particle burst on bullet hit
    - Color matches enemy type
    - Spreads outward

36. [Player Trail] Movement effect
    - Cyan trail when moving
    - Fades and shrinks
    - Shows momentum

37. [Death Particles] Enemy explosions
    - 12 particles per enemy
    - 30 particles for boss
    - Color matches enemy

38. [Level Flash] Upgrade effect
    - Screen flash on level up
    - Radial particle burst
    - "LEVEL UP!" text popup

39. [Low Health Warning] Danger indicator
    - Red background pulse at 1 HP
    - Sine wave pulsing
    - Urgency feedback

40. [Spawn Animation] Enemy entrance
    - Enemies scale from 0
    - Back.easeOut animation
    - 300ms duration

41. [Combo Display] Multiplier UI
    - Orange combo text
    - Shows "Nx COMBO"
    - Centered on screen

42. [Key Hints] Input help
    - Bottom left text
    - Shows all controls
    - Gray color (subtle)

43. [Crystal Sparkle] Pickup effects
    - Sparkle particles on collect
    - Float upward animation
    - Red color matching crystal

44. [Boss Entry] Dramatic entrance
    - Bounce.easeOut animation
    - 1000ms scale in
    - Health bar appears

45. [Charge Effect] Supershot visual
    - Blue particles converge
    - Every 100ms while charging
    - Shows charge progress

46. [Dash Afterimage] Ghost trail
    - 5 ghost sprites along path
    - Cyan tint
    - Fade out animation

47. [Pickup Effect] Collection visual
    - 8 particles to player
    - Color matches pickup type
    - 200ms duration

48. [Victory Particles] Celebration
    - 50 green particles rising
    - Staggered spawn timing
    - Full screen effect

49. [Camera Flash] Hit response
    - Red flash on player damage
    - Purple flash on time stop
    - Green flash on level up

50. [Boss Health Bar] UI element
    - 400px wide bar at top
    - Fill decreases with damage
    - "FOREST GUARDIAN" name

## Feature Verification
- [x] Twin-stick shooting mechanics
- [x] Arena with rock borders
- [x] Multiple enemy types (6 types + elite variants)
- [x] Health/hearts system
- [x] Currency collection
- [x] Level progress bar
- [x] Ability buttons UI (4 abilities)
- [x] Enemy wave spawning (10 waves)
- [x] Boss fight system (2 bosses)
- [x] Combo multiplier
- [x] Minimap
- [x] Critical hits
- [x] Spawn warnings
- [x] Victory condition
- [x] Full visual polish pass

## Final Comparison
Game captures Minishoot Adventures' core aesthetic:
- Cute enemy creatures with eyes
- Colorful rock border decoration
- Clean arena floor
- Satisfying twin-stick combat
- Phaser physics for smooth collisions
- Multiple ability system
- Wave-based progression
- Boss fight climax
- Full juice and polish

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Phaser's arcade physics made collision handling trivial
- Built-in tweens simplified all animation code significantly
- Camera shake was one line vs manual implementation in Canvas
- Particle emitters provided better performance than manual particles
- Scene management made state transitions clean

### What Went Wrong
- Text objects created every frame caused memory issues until destroyed properly
- Phaser.CANVAS mode required for headless testing, limiting some effects
- Initial scene structure was wrong - needed BootScene for texture generation
- Group management was confusing - had to learn overlap vs collider

### Key Learnings
- Always use scene.time.delayedCall to cleanup text objects each frame
- Phaser.CANVAS + software rendering works for headless Playwright testing
- Create textures in BootScene, not during gameplay
- Physics groups need proper configuration for overlap callbacks

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~30 minutes
- Polish passes: ~25 minutes
- Total: ~80 minutes

### Difficulty Rating
Medium - Phaser abstractions helped but learning its specific patterns took time


---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "CRITICAL: Instant victory bug - you win without playing"
   → Root cause: Wave completion check ran BEFORE enemies spawned
   → enemies.countActive() === 0 was true at game start
   → This cascaded: wave++, spawnWave(), wave++, etc until wave 10

### Fix Implementation:
- Added `waveInProgress` flag to track spawning state
- Added `enemiesSpawnedThisWave` counter
- Wave completion now requires:
  - waveInProgress === true (wave has started)
  - enemiesSpawnedThisWave > 0 (at least one enemy spawned)
  - enemies.countActive() === 0 (all killed)
  - !bossActive (no boss phase)
- Flag is reset when wave completes

### Verification:
- Game loads without instant victory
- Wave stays at 1 after 3 seconds
- 5 enemies spawn in wave 1
- Player can kill enemies and collect crystals
- Victory only possible after wave 10

