# Iteration Log: Derelict Ship (Canvas)

## Reference Analysis
- Main colors: Dark grays (#2a2a2a), dark backgrounds (#0a0808), blood red (#6a2020)
- Art style: Top-down 2D with Darkwood-style vision cone, dark atmospheric horror
- UI elements: O2 bar (blue), HP bar (red), flashlight battery, ship integrity, sector indicator, messages
- Core features from GDD:
  - Constant O2 drain (survival horror tension)
  - Vision cone (90 degrees, Darkwood-style)
  - Flashlight with battery management
  - Ship integrity decay timer
  - Enemies (Crawler, Shambler)
  - Melee combat
  - Item pickups (O2, medkits)
  - Escape pod win condition

## Iterations 1-10: Initial Build
1. Initial build - Canvas structure with game loop
2. Added procedural room generation with corridors
3. Implemented player movement (WASD) with collision detection
4. Added Darkwood-style 90-degree vision cone
5. Implemented darkness overlay with cone cut-out using composite operations
6. Added O2 drain system (idle, walking, running, combat rates)
7. Added HP system with damage
8. Created Crawler and Shambler enemy types with patrol/chase AI
9. Added blood stain effects for atmosphere
10. Implemented UI bars (O2, HP, flashlight, integrity)

## Iterations 11-20: Core Polish
11. [x] Debug overlay (press Q to toggle) - shows all game stats
12. [x] Stats tracking system - killCount, totalDamageDealt, totalDamageTaken, critCount
13. [x] Critical hit system (15% chance, 2x damage) with yellow damage numbers
14. [x] Kill streak system with streak timer and feedback messages
15. [x] Floating damage numbers on hit (red for damage, yellow for crits)
16. [x] Damage tracking for player attacks (attacksMade)
17. [x] Damage tracking for enemy melee attacks
18. [x] Screen shake on damage dealt and received
19. [x] Damage flash effect (red screen overlay) when taking damage
20. [x] Attack visual effect (white flash at attack point)

## Iterations 21-30: Visual Feedback & UI
21. [x] Low health pulsing red vignette effect (below 30 HP)
22. [x] Floating text system for all feedback
23. [x] Enhanced blood particles (more particles for crits)
24. [x] Kill streak feedback messages (TRIPLE KILL, QUAD KILL, etc.)
25. [x] Healing particles when using medkit (green)
26. [x] O2 pickup floating text and particles (blue)
27. [x] Item pickup sparkle effect
28. [x] Death burst particle effect for killed enemies
29. [x] Particle system for blood and effects
30. [x] Kill streak display (2x STREAK and up)

## Iterations 31-40: Final Polish
31. [x] Enhanced game over screen with detailed stats
32. [x] Performance rating on death (LOST/SURVIVOR/FIGHTER/WARRIOR)
33. [x] Enhanced victory screen with detailed stats
34. [x] Efficiency rating system (S/A/B/C/D) for victory
35. [x] Max kill streak tracking
36. [x] Kill streak timer decay system (3 second window)
37. [x] Items picked up tracking
38. [x] Attacks made tracking in debug overlay
39. [x] Time survived display in end screens
40. [x] Full debug info display with all tracked stats

## Feature Verification
- [x] WASD movement: tested, works with collision detection
- [x] Mouse aim: player rotates toward cursor
- [x] Vision cone: 90 degree cone, darkness outside
- [x] O2 drain: constant drain, different rates for actions
- [x] HP system: damage from enemies
- [x] Flashlight toggle: F key, battery management
- [x] Enemy AI: patrol and chase states working
- [x] Melee combat: click to attack with visual effect
- [x] Ship integrity: slowly decays
- [x] Items: O2 canisters and medkits
- [x] Victory condition: reach escape pod
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Dark atmospheric style achieved with #0a0808 background
- Vision cone creates tension (can't see behind)
- O2 constantly draining creates urgency
- Grid floor pattern like reference interior shots
- Blood stains add to horror atmosphere
- Enemy silhouettes in darkness
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Darkwood-style 90-degree vision cone creates excellent horror tension
- O2 drain mechanic adds constant survival pressure without feeling unfair
- Different drain rates (idle/walk/run/combat) create meaningful movement decisions
- Blood stains enhance atmosphere and tell environmental stories
- Screen shake and damage flash make combat feel impactful
- Critical hit and kill streak systems make combat more satisfying
- Floating damage numbers provide excellent combat feedback
- Debug overlay helpful for testing all systems

### What Went Wrong
- Ship integrity decay needed balancing - too fast felt punishing
- Vision cone edges sometimes had aliasing artifacts
- Enemy pathfinding in narrow corridors occasionally bugged
- Canvas composite operations for lighting required careful ordering

### Key Learnings
- Restricted vision is extremely effective for horror games
- Resource drain mechanics need multiple rates for different actions
- Atmosphere (blood, darkness) matters as much as mechanics for horror
- Canvas globalCompositeOperation = 'destination-out' essential for cone cutout
- Stats tracking adds replay value and makes end screens more meaningful

### Time Spent
- Initial build: ~40 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~20 minutes
- Iterations 31-40: ~20 minutes
- Total: ~105 minutes

### Difficulty Rating
Medium - Vision cone and O2 systems required careful implementation. Adding visual feedback was straightforward with established patterns.
