# Iteration Log: Subterrain (Canvas)

## Reference Analysis
- Main colors: Dark gray floors (#2a2828), red blood (#6a2020, #8a3030), green acid (#305a30), brown enemies (#6a5848)
- Art style: Top-down 2D with diamond floor pattern, gritty industrial sci-fi horror
- UI elements: Health bar (red), survival meters (hunger orange, thirst blue, fatigue gray), infection bar (green), global infection counter, quick slots
- Core features from GDD:
  - WASD movement
  - Mouse aim and click to attack
  - 4 survival meters (health, hunger, thirst, fatigue)
  - Infection meter
  - Global infection timer
  - 5 sectors (hub, storage, medical, research, escape)
  - Enemies (shambler, crawler, spitter, brute, cocoon)
  - Loot containers
  - Crafting (basic)
  - Win condition (escape pod with keycard)

## Iterations 1-10: Initial Build
1. Initial build - Created hub sector with diamond floor pattern, doors to other sectors
2. Added survival meters UI (HP, HUN, THI, FAT, INF) - positions match reference style
3. Added enemy types with correct colors (shambler tan, spitter green, brute large)
4. Added blood splatter effects when enemies die
5. Added cocoon enemy type with glowing effect and spawn mechanic
6. Added global infection timer with red warning display
7. Added quick slots for consumable items (1-4 keys)
8. Added facilities (workbench, bed, storage, power panel, medical station)
9. Added darkness overlay for unpowered sectors
10. Added infection visual effect (green screen tint at high infection)

## Iterations 11-20: Core Polish
11. [x] Debug overlay (press Q to toggle) - shows all game stats
12. [x] Stats tracking system - killCount, totalDamageDealt, totalDamageTaken, critCount
13. [x] Critical hit system (15% chance, 2x damage) with yellow damage numbers
14. [x] Kill streak system with streak timer and feedback messages
15. [x] Item drops from killed enemies (20% chance - scrap, cloth, chemicals)
16. [x] Floating damage numbers on hit (red for damage, yellow for crits)
17. [x] Damage tracking for enemy melee attacks
18. [x] Damage tracking for enemy projectile attacks
19. [x] Screen shake on damage dealt and received
20. [x] Damage flash effect (red screen overlay) when taking damage

## Iterations 21-30: Visual Feedback & UI
21. [x] Low health pulsing red vignette effect (below 30% HP)
22. [x] Floating text system for all feedback
23. [x] Enhanced blood particles (more particles for crits)
24. [x] Kill streak feedback messages (TRIPLE KILL, QUAD KILL, etc.)
25. [x] Healing particles when using medkit
26. [x] Cure particles when using antidote
27. [x] Item use floating text feedback (HUNGER -30, THIRST -40, etc.)
28. [x] Container looting tracking
29. [x] Items used tracking
30. [x] Sector visited tracking with transition messages

## Iterations 31-40: Final Polish
31. [x] Enhanced game over screen with detailed stats
32. [x] Performance rating on death (SURVIVOR/FIGHTER/STRUGGLER/VICTIM)
33. [x] Enhanced victory screen with detailed stats
34. [x] Efficiency rating system (S/A/B/C/D) for victory
35. [x] Max kill streak tracking
36. [x] Kill streak timer decay system
37. [x] Sector transition floating text (ENTERING: SECTOR NAME)
38. [x] Floating text fade-out animation
39. [x] Screen effect smooth decay
40. [x] Full debug info display with all tracked stats

## Feature Verification
- [x] WASD movement: tested, works
- [x] Mouse aim: player rotates toward cursor
- [x] Click to attack: melee attack with fists works
- [x] Survival meters display and decay over time
- [x] Global infection increases over time
- [x] Hub sector safe zone (no enemies)
- [x] Door transitions between sectors
- [x] Enemy spawning in non-hub sectors
- [x] Enemy AI chases player
- [x] Loot containers can be looted
- [x] Items can be used with number keys
- [x] Victory condition: escape pod with keycard
- [x] Game over conditions: health 0, infection 100, global 100
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Diamond floor pattern matches reference style
- Dark industrial color palette achieved
- Survival meters positioned like reference (top-left)
- Global infection counter in bottom-right like reference
- Enemy designs simplified but functional
- Blood effects present with enhanced particles
- Room-based sector layout implemented
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Multiple survival meters create meaningful resource management decisions
- Global infection timer adds constant urgency without feeling unfair
- Sector-based map design gives clear progression goals
- Enemy variety (shambler, crawler, spitter, brute, cocoon) keeps combat interesting
- Darkness in unpowered sectors creates genuine tension
- Critical hit and kill streak systems make combat more satisfying
- Floating text feedback makes all actions feel responsive

### What Went Wrong
- Balancing 5 survival meters simultaneously required constant tweaking
- Door transitions sometimes felt abrupt without loading screens
- Enemy spawning near sector entrances could feel unfair

### Key Learnings
- Survival games need carefully balanced decay rates - too fast feels punishing, too slow removes tension
- Canvas 2D handles multiple overlapping systems (meters, enemies, effects) efficiently
- Visual feedback (screen tints, blood, floating text) essential for communicating game state
- Stats tracking adds replay value and makes end screens more meaningful

### Time Spent
- Initial build: ~40 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~25 minutes
- Iterations 31-40: ~20 minutes
- Total: ~110 minutes

### Difficulty Rating
Medium - Balancing multiple survival systems was the main challenge. Adding visual feedback was straightforward with the floating text system.
