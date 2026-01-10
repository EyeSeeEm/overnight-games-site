# Iteration Log: FTL Clone (Canvas)

## Reference Analysis
- Main colors: Dark space (#0a0a1a), green UI text (#00ff00), cyan shields (#00ccff), orange weapons (#ff6600)
- Art style: Top-down spaceship cross-sections, sci-fi pixel aesthetic
- UI elements: Hull bar, shield bubbles, system power panel, weapon bar, target panel, crew list
- Core features from GDD: Ship rooms, power management, crew movement, weapons targeting, pausable combat

## Base Iterations (1-10)

1. [Initial] Built basic ship layout with rooms
   - DIFF: Rooms lacked system identification
   - FIX: Added system letter indicators to each room

2. [Combat] Implemented weapon charging and firing
   - Weapons charge over time, click to enter targeting mode

3. [Shields] Added shield bubble visual and recharge mechanic
   - Cyan ellipse around ship, layers based on power level

4. [Crew] Implemented crew members with movement
   - Click to select, click room to move, health bars shown

5. [Power] Added reactor power distribution
   - System panel with +/- buttons to adjust power

6. [Enemy Ship] Created enemy with AI weapon firing
   - Enemy fires when weapons charged, checks evasion/shields

7. [UI Polish] Added top bar with hull segments
   - FTL-style hull bar with individual segments

8. [Target Panel] Enemy info display on right side
   - Shows hull, shields, relationship status

9. [Combat Log] Added scrolling combat messages
   - Shows hits, misses, shield absorptions

10. [Visual Polish] Space background with starfield and planet
    - Moving stars, radial gradient planet/nebula

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
    - Laser (blocked by shields)
    - Missile (ignores shields, uses ammo)
    - Ion (removes shield layers, no hull damage)

14. [Fire Hazards] Room fire mechanics
    - Fire spreads between adjacent rooms
    - Damages crew and systems over time
    - Crew can fight fires (repair action)

15. [Breach Hazards] Hull breach mechanics
    - Drains oxygen from room
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
    - Text events with multiple choices
    - Distress beacon scenarios
    - Abandoned ship exploration
    - Combat/reward outcomes

20. [Sector Progression] Map advancement
    - 8 beacons per sector
    - Beacon counter in UI
    - Victory at sector completion

21. [Resource Management] Scrap, missiles, fuel
    - Scrap earned from combat victories
    - Missiles consumed by missile weapons
    - Fuel consumed per jump

22. [Combat Rewards] Victory bonuses
    - Random scrap amounts
    - Chance for missiles and fuel
    - Enemy template affects rewards

23. [Weapon Slots] Multiple weapon system
    - Three weapon slots available
    - Independent charging per weapon
    - Click to select and target

24. [System Damage] Targeted system destruction
    - Weapons can target specific rooms
    - System damage reduces function
    - Shields, weapons, engines affected

25. [Evasion Mechanics] Engine-based dodge
    - Evasion chance from engine power
    - Displayed on target panel
    - Affects both ships

26. [Pause Combat] Strategic pause
    - Space bar toggles pause
    - Orders can be given while paused
    - FTL's signature mechanic

27. [Auto-fire Mode] Automated weapon firing
    - Weapons fire automatically when charged
    - Can be toggled per weapon
    - Quality of life feature

28. [Victory/Defeat] End game conditions
    - Victory when enemy hull reaches 0
    - Defeat when player hull reaches 0
    - Next beacon or game over

29. [Crew Combat] Boarding preparation
    - Crew can fight intruders
    - Combat skill affects damage
    - Mantis excels in combat

30. [O2 System] Oxygen management
    - O2 system maintains air levels
    - Breach/fire affects oxygen
    - Crew suffocates without air

## POLISH Passes (31-50)

31. [Screen Shake] Impact feedback
    - Shake on receiving damage
    - Intensity based on damage amount
    - Phaser-style camera effect

32. [Screen Flash] Visual alerts
    - Red flash on hull damage
    - Blue flash on shield hit
    - Orange flash on weapon fire

33. [Floating Text] Damage numbers
    - "+/-XX" popups on events
    - Color coded by type
    - Float upward and fade

34. [Particle Effects] Combat particles
    - Explosion particles on hits
    - Color matches weapon type
    - Spreads outward

35. [Shield Animation] Pulsing shields
    - Shield bubble pulses subtly
    - Flashes on absorbing hit
    - Multiple layers visible

36. [Engine Glow] Thruster effects
    - Animated engine flame
    - Intensity based on power
    - Yellow/orange gradient

37. [Weapon Charge Bar] Visual feedback
    - Individual charge bars per weapon
    - Green when ready
    - Smooth fill animation

38. [Room Highlights] Selection feedback
    - Highlight on hover
    - Selected room glow
    - Target mode indicator

39. [Crew Selection] Visual indicators
    - Circle around selected crew
    - Health bar above crew
    - Race-colored indicators

40. [Combat Log Polish] Message styling
    - Color-coded messages
    - Smooth scroll animation
    - Maximum message limit

41. [System Icons] Room identification
    - Letter codes in rooms
    - System power indicators
    - Damage state colors

42. [Top Bar Polish] Resource display
    - Hull bar with segments
    - Scrap counter
    - Missile and fuel counts

43. [Target Panel Polish] Enemy info
    - Hull bar visualization
    - Shield indicator
    - Evasion percentage

44. [Weapon Panel Polish] Bottom bar
    - Weapon name display
    - Type indicator
    - Charge progress

45. [Star Animation] Background depth
    - Parallax star movement
    - Different star sizes
    - Twinkling effect

46. [Planet/Nebula] Background elements
    - Radial gradient planet
    - Subtle glow effect
    - Positioned off-center

47. [Pause Overlay] Pause feedback
    - Large "PAUSED" text
    - Semi-transparent overlay
    - Resume instructions

48. [Event Popup] Choice presentation
    - Centered event panel
    - Choice buttons
    - Outcome messages

49. [Victory/Defeat Screen] End state
    - Clear win/lose message
    - Statistics display
    - Continue/restart option

50. [Performance] Optimization
    - Efficient render loop
    - Object pooling for projectiles
    - Particle cleanup

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
- Full visual polish

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Ship room layout was immediately recognizable as FTL-style
- Crew race system added strategic depth without overwhelming complexity
- Power management created meaningful tactical decisions
- Weapon types (laser/missile/ion) each felt distinct
- Pause mechanic worked smoothly for strategic planning

### What Went Wrong
- Initial shield recharge was too fast, trivializing combat
- Fire spread mechanics were too aggressive at first
- Room click detection overlapped with crew selection
- Enemy AI weapon timing needed multiple balance passes

### Key Learnings
- Ship management games need clear visual feedback for all states
- Crew pathfinding should use room centers, not exact click positions
- Different weapon types need visually distinct projectiles
- Pause-based gameplay requires all UI to be readable when frozen

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~50 minutes
- Polish passes: ~35 minutes
- Total: ~115 minutes

### Difficulty Rating
Very Hard - FTL's systems are deeply interconnected; balancing crew, power, weapons, and shields together was complex
