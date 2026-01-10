# Iteration Log: FTL Clone (Phaser)

## Reference Analysis
- Main colors: Dark space (#0a0a1a), green UI text (#00ff00), cyan shields (#00ccff), orange weapons (#ff6600)
- Art style: Top-down spaceship cross-sections, sci-fi pixel aesthetic
- UI elements: Hull bar, shield bubbles, system power panel, weapon bar, target panel, crew list
- Core features from GDD: Ship rooms, power management, crew movement, weapons targeting, pausable combat

## Base Iterations (1-10)

1. [Initial] Ported canvas version to Phaser 3
   - Used Phaser.CANVAS renderer for headless compatibility
   - Set up BootScene and GameScene with proper class structure

2. [Ship] Implemented player ship with room system
   - Eight rooms: shields, weapons, cockpit, engines, oxygen, medbay, doors, sensors
   - Each room has system letter indicator
   - Ship hull shape with wing sections

3. [Crew] Added crew members with selection/movement
   - Four crew with different races
   - Click to select, click room to move
   - Health bars displayed above each crew

4. [Shields] Added shield bubble rendering
   - Cyan ellipse around ship with animation
   - Number of layers based on power level
   - Visual indicator in system panel

5. [Power] Implemented reactor power distribution
   - System panel with +/- buttons
   - Real-time power adjustment
   - 10 total reactor power

6. [Enemy] Created enemy ship with AI
   - Enemy fires when weapons charged
   - Checks player evasion and shields
   - Different ship silhouette shape

7. [Weapons] Added weapon charging and targeting
   - Three weapons: Burst Laser II, Artemis Missile, Ion Blast
   - Charge progress bars
   - Click weapon to enter targeting mode

8. [UI] Added top bar with resources
   - Hull segmented bar with 30 segments
   - Scrap, missiles, fuel counters
   - Sector/beacon progress indicator

9. [Target Panel] Enemy info display
   - Shows enemy hull, shields, evasion
   - Relationship status (Hostile)
   - Room targeting overlay

10. [Background] Space starfield and planet
    - Animated twinkling stars
    - Large planet with glow effect
    - Dark space color matching reference

## EXPAND Passes (11-30)

11. [Crew Races] Five distinct crew types
    - Human (balanced stats)
    - Mantis (fast, strong combat, weak repair)
    - Engi (slow, weak combat, fast repair)
    - Rockman (slow, fire immune, extra health)
    - Zoltan (fragile, provides system power)

12. [Enemy Templates] Four enemy ship types
    - Fighter (balanced, standard threat)
    - Scout (weak hull, high evasion)
    - Cruiser (heavy hull, multiple weapons)
    - Auto-Drone (no crew, low evasion)

13. [Weapon Types] Three weapon categories
    - Laser (blocked by shields, red projectiles)
    - Missile (ignores shields, uses ammo, orange)
    - Ion (removes shield layers, blue)

14. [Fire Hazards] Room fire mechanics
    - Fire spreads over time
    - Damages crew and systems
    - Crew can fight fires (extinguish)

15. [Breach Hazards] Hull breach mechanics
    - Purple overlay on breached rooms
    - Damages crew over time
    - Requires repair to seal

16. [Medbay Healing] Medical bay functionality
    - Crew in powered medbay heals over time
    - Healing rate based on power level
    - Critical for crew survival

17. [Crew Repair] System repair mechanics
    - Crew repairs damaged systems in room
    - Repair speed based on crew race
    - Engi repairs twice as fast

18. [Projectile System] Animated weapon fire
    - Projectiles travel from ship to target
    - Different colors per weapon type
    - Trail effects behind projectiles

19. [Event System] Random beacon events
    - Distress Beacon scenario
    - Abandoned Station exploration
    - Merchant Ship encounters
    - Choice-based outcomes

20. [Sector Progression] Map advancement
    - 8 beacons per sector
    - Sector counter in UI
    - Progress through beacons

21. [Resource Management] Scrap, missiles, fuel
    - Scrap earned from combat victories
    - Missiles consumed by missile weapons
    - Fuel for sector jumps

22. [Combat Rewards] Victory bonuses
    - Scrap rewards based on enemy
    - Missile drops from enemies
    - Fuel recovery chances

23. [Weapon Slots] Multiple weapon system
    - Three weapon slots available
    - Independent charging per weapon
    - Type-colored labels

24. [System Damage] Targeted system destruction
    - Weapons can target specific rooms
    - System damage reduces function
    - Red overlay on damaged rooms

25. [Evasion Mechanics] Engine-based dodge
    - Evasion chance from engine power
    - Displayed on target panel
    - EVADE floating text on dodge

26. [Pause Combat] Strategic pause
    - Space bar toggles pause
    - PAUSED overlay with instructions
    - FTL's signature mechanic

27. [Random Events] Between-combat encounters
    - 30% chance of event after combat
    - Multiple choice options
    - Risk/reward outcomes

28. [Victory/Defeat] End game conditions
    - Victory screen with rewards listed
    - Defeat shows sector reached
    - Click to continue/restart

29. [Crew Health Colors] Health state feedback
    - Green health bar >50%
    - Orange health bar 25-50%
    - Red health bar <25%

30. [System Damage Indicator] Visual damage state
    - Red system label when damaged
    - Damage reduces effective power
    - Crew repairs restore function

## POLISH Passes (31-50)

31. [Screen Shake] Impact feedback
    - Shake on receiving damage
    - Shake on enemy destruction
    - Phaser camera system

32. [Screen Flash] Visual alerts
    - Red flash on hull damage
    - Color flash on weapon fire
    - Smooth fade out

33. [Floating Text] Damage numbers
    - MISS, EVADE, SHIELD text
    - Damage amounts float up
    - Color coded by type

34. [Particle Effects] Combat particles
    - Explosion particles on hits
    - Color matches weapon type
    - Spreads outward and fades

35. [Shield Animation] Pulsing shields
    - Shield bubble pulses subtly
    - Size varies with sine wave
    - Multiple layers visible

36. [Engine Glow] Thruster effects
    - Animated engine flame
    - Pulsing glow effect
    - Yellow/orange gradient

37. [Weapon Charge Bar] Visual feedback
    - Individual charge bars per weapon
    - Green when ready
    - Orange during charge

38. [Room Highlights] Selection feedback
    - Red border during targeting
    - Clear room boundaries
    - Letter labels in rooms

39. [Crew Selection] Visual indicators
    - Yellow ring around selected crew
    - Race-colored circles
    - Health bar position

40. [Combat Log Polish] Message styling
    - Color-coded messages
    - Blue for misses/evades
    - Red for hits
    - Cyan for shields

41. [System Panel Polish] UI refinement
    - Colored system labels
    - Clear power buttons
    - Reactor display

42. [Top Bar Polish] Resource display
    - Hull bar with segments
    - Resource counters
    - Sector/beacon display

43. [Target Panel Polish] Enemy info
    - Hull bar visualization
    - Shield circles
    - Evasion percentage

44. [Weapon Panel Polish] Bottom bar
    - Weapon name display
    - Type indicator colored
    - Charge progress visible

45. [Star Animation] Background depth
    - Twinkling star effect
    - Different star sizes
    - Parallax movement

46. [Planet Glow] Background elements
    - Multi-layer planet
    - Subtle glow rings
    - Atmospheric detail

47. [Event Popup Polish] Choice presentation
    - Orange border styling
    - Word wrap for text
    - Green choice buttons

48. [Victory Screen Polish] Rewards display
    - Listed rewards separately
    - Missile and fuel bonuses
    - Clear continue prompt

49. [Title Screen Polish] Start screen
    - Large FTL title
    - Control hints
    - Click to start

50. [Performance] Optimization
    - Efficient render loop
    - Projectile/particle cleanup
    - Text object management

## Feature Verification
- [x] Ship cross-section with interior rooms
- [x] Five crew races with unique abilities
- [x] Crew members that can be selected and moved
- [x] Power management with reactor distribution
- [x] Shield layers that recharge over time
- [x] Three weapon types (laser, missile, ion)
- [x] Four enemy ship templates
- [x] Animated projectiles with trails
- [x] Fire and breach hazards
- [x] Medbay healing system
- [x] Crew repair mechanics
- [x] Event system with choices
- [x] Sector/beacon progression
- [x] Pause functionality (SPACE key)
- [x] Screen shake and flash effects
- [x] Floating text feedback
- [x] Particle effects

## Final Comparison
Game captures FTL's core aesthetic:
- Dark space background with stars and planet
- Ship interiors with room layout
- Green/cyan/orange UI colors
- System power management panel
- Crew races with unique visuals
- Weapon types with distinct behaviors
- Pausable real-time combat
- Event-driven progression
- Full Phaser visual effects

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Phaser camera shake made combat hits impactful
- Projectile trail system using arrays worked cleanly
- Event popup system with Phaser text was clear
- Graphics API handled ship/room rendering well
- Screen flash for damage provided good feedback

### What Went Wrong
- Class initialization order required restructuring entire file
- Delta time handling was inconsistent initially
- Projectile collision detection needed manual distance checks
- Memory management for particles/floating text needed attention

### Key Learnings
- Always structure Phaser files: classes first, then config at end
- Use dt = delta/1000 consistently for time-based updates
- Manual projectile systems need explicit cleanup on state changes
- Phaser time.delayedCall is essential for deferred text destruction

### Time Spent
- Initial build: ~35 minutes
- Expand passes: ~45 minutes
- Polish passes: ~35 minutes
- Total: ~115 minutes

### Difficulty Rating
Very Hard - FTL's system complexity combined with Phaser class quirks made this the most challenging game
