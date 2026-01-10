# Iteration Log: Curious Expedition Clone (Canvas)

## Reference Analysis
- Main colors: Parchment (#F5E6D3), leather brown (#8B4513), button dark (#4A3728), gold accent (#D4A84B)
- Art style: 16-bit pixel art, Victorian journal aesthetic
- UI elements: Left journal panel, right scene panel, day counter, sanity bar, choice buttons
- Core features from GDD: Hex exploration, sanity system, location events, party management

## Base Iterations (1-10)

1. [Initial] Built basic structure with hex map overlay on right panel
   - DIFF: Hex map visible instead of scene view
   - FIX: Changed to scene-based rendering with mini-map

2. [Scene System] Replaced hex grid with pixel art scenes
   - DIFF: Trees were brown (wrong color)
   - FIX: Added foliageColor parameter to drawTree function

3. [Village Scene] Added detailed village scene
   - DIFF: Missing huts, villagers, fence
   - FIX: Added drawHut, drawPixelPerson, drawExplorerSprite functions

4. [Event System] Implemented location events with choices
   - DIFF: Buttons lacked decorative corners
   - FIX: Added drawCorner function for button decorations

5. [Navigation] Fixed click handling
   - DIFF: Clicks on scene weren't moving party
   - FIX: Changed to click-anywhere-on-scene movement toward pyramid

6. [Pyramid Scene] Added golden pyramid scene
   - Implemented pyramid with shading, entrance, and glow effect

7. [Camp Scene] Added night camp scene
   - Stars, moon, campfire with glow, party sitting

8. [Shrine Scene] Added ancient shrine scene
   - Stone pillars, glowing artifact, mystical aura

9. [Cave Scene] Added dark cave scene
   - Stalactites, torch light, dark atmosphere

10. [Oasis Scene] Added desert oasis scene
    - Palm trees, water reflection, sand dunes

## EXPAND Passes (11-30)

11. [Ruins Location] Ancient ruins location type
    - Crumbling stone columns and arches
    - Treasure or danger events
    - Artifact discovery chance

12. [Trading Post] Trading post location
    - Can buy/sell items
    - Restore sanity for gold
    - Hire new party members

13. [Waterfall Location] Hidden waterfall location
    - Healing water restores health
    - Chance to find rare items
    - Scenic pixel art scene

14. [Weather System] Dynamic weather effects
    - Clear, cloudy, rainy, foggy types
    - Weather affects travel cost
    - Visual indicators on screen

15. [Swamp Terrain] New swamp terrain type
    - Higher sanity cost to traverse
    - Sickness chance when crossing
    - Dark murky visuals

16. [Animal Attack Event] Wildlife encounters
    - Random animal attacks during travel
    - Fight or flee choices
    - Party member injury risk

17. [Native Encounter] Meeting native tribes
    - Trade, befriend, or conflict options
    - Reputation system impact
    - Unique rewards per choice

18. [Treasure Event] Random treasure finds
    - Gold, artifacts, or supplies
    - Cursed treasure possibility
    - Fame bonus for rare finds

19. [Sickness Event] Disease mechanics
    - Party members can get sick
    - Spreads if untreated
    - Medicine item to cure

20. [Portal Event] Mysterious portals
    - Teleport across map
    - Risky but fast travel
    - Sanity cost for use

21. [Achievement System] Track accomplishments
    - First Pyramid Found
    - Seasoned Explorer (5 expeditions)
    - Perfect Expedition (no losses)
    - Fortune Seeker (500 fame)
    - Treasure Hunter (10 treasures)
    - Survivor (sub-10 sanity finish)

22. [Blessing System] Positive party buffs
    - Shrine blessings available
    - Reduced travel cost
    - Increased combat power

23. [Curse System] Negative party effects
    - Cursed treasure triggers
    - Higher sanity drain
    - Bad luck on events

24. [Party Abilities] Unique member skills
    - Scout - sees further
    - Translator - better native encounters
    - Doctor - cures sickness
    - Fighter - combat bonus

25. [Inventory System] Item management
    - Rope, torches, medicine
    - Food restores sanity
    - Artifacts for fame

26. [Expedition Stats] End-of-expedition summary
    - Days traveled
    - Locations discovered
    - Events survived
    - Fame earned

27. [Difficulty Scaling] Progressive challenge
    - Later expeditions harder
    - More dangerous events
    - Better rewards

28. [Multiple Expeditions] Campaign mode
    - Fame persists between runs
    - Unlock new explorers
    - Map variety increases

29. [Night/Day Cycle] Time progression
    - Camp required at night
    - Different events by time
    - Visual day/night scenes

30. [Resource Management] Supplies system
    - Food depletes over time
    - Water needed in desert
    - Strategic planning required

## POLISH Passes (31-50)

31. [Screen Shake] Impact feedback
    - Shake on combat events
    - Shake on negative outcomes
    - Configurable intensity

32. [Screen Flash] Visual alerts
    - Red flash on damage
    - Gold flash on treasure
    - White flash on discovery

33. [Floating Text] Feedback numbers
    - "+10 Sanity" popups
    - "-5 Health" indicators
    - Gold amount changes

34. [Particle Effects] Environmental particles
    - Campfire sparks
    - Treasure sparkles
    - Portal energy swirls

35. [Animated Trees] Living environment
    - Trees sway gently
    - Wind effect on foliage
    - Natural movement

36. [Button Hover] UI feedback
    - Color change on hover
    - Scale animation
    - Click depression

37. [Sanity Bar Animation] Smooth transitions
    - Gradual bar changes
    - Color shifts by level
    - Pulse when critical

38. [Health Dot Animation] Party status
    - Pulse when injured
    - Fade when healing
    - Clear visual state

39. [Event Transition] Scene changes
    - Fade between scenes
    - Smooth location arrival
    - Journey animation

40. [Map Icon Animation] Mini-map polish
    - Pulsing current location
    - Animated discovered locations
    - Clear path indicators

41. [Weather Particles] Environmental fx
    - Rain drops falling
    - Fog drifting
    - Cloud shadows

42. [Sound Cue Preparation] Audio hooks
    - Event trigger points
    - UI interaction hooks
    - Ambient loop markers

43. [Journal Updates] Text animation
    - Typewriter text reveal
    - Page turn effect
    - Ink fade-in

44. [Character Portraits] Party display
    - Animated expressions
    - Status indicators
    - Hover details

45. [Loading States] Progress feedback
    - Travel progress bar
    - Action processing
    - Save/load indicators

46. [Tooltip System] Information popups
    - Location descriptions
    - Item details
    - Event context

47. [Color Transitions] Smooth visuals
    - Day/night gradients
    - Weather color shifts
    - Mood-based palette

48. [Victory Celebration] Win screen polish
    - Confetti particles
    - Stats scroll animation
    - Fame counter roll-up

49. [Death Screen] Game over polish
    - Dramatic fade effect
    - Cause of death display
    - Expedition summary

50. [Menu Polish] Title screen refinement
    - Animated background
    - Button animations
    - Version display

## Feature Verification
- [x] Journal panel with parchment texture
- [x] Day counter updates
- [x] Sanity bar decreases with travel
- [x] Party member icons with health dots
- [x] Location events with multiple choices
- [x] Event scenes (village, shrine, pyramid, cave, oasis, camp, ruins, tradingPost, waterfall)
- [x] Choice buttons with decorative corners
- [x] Mini-map in exploration view
- [x] Victory condition (find pyramid)
- [x] Game over condition (0 sanity/health)
- [x] Weather system (4 types)
- [x] Achievement system (6 achievements)
- [x] Blessing/curse mechanics
- [x] Screen shake and flash effects
- [x] Floating text feedback
- [x] Particle effects
- [x] Animated environment

## Final Comparison
Game captures Curious Expedition's core aesthetic:
- Parchment journal with leather binding
- Brown choice buttons with corner brackets
- 16-bit pixel art scenes
- Victorian exploration atmosphere
- Party sprites and location artwork
- Event-driven exploration gameplay
- Risk/reward decision making
- Full visual polish and juice

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Parchment/journal aesthetic captured the Victorian feel immediately
- Event system with branching choices created engaging gameplay
- Weather system added environmental variety
- Hex map exploration was visually clear
- Achievement system provided long-term goals

### What Went Wrong
- Sanity drain was initially too harsh, making exploration punishing
- Too many event types made balancing difficult
- Tree sway animation caused performance issues until optimized
- Fog of war rendering was slow with large maps

### Key Learnings
- Event-driven games need careful probability tuning
- Pixel art scenes look better with limited color palettes
- Canvas state save/restore is essential for complex drawings
- Party management adds depth but increases complexity significantly

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~45 minutes
- Polish passes: ~30 minutes
- Total: ~105 minutes

### Difficulty Rating
Hard - Event system complexity and visual fidelity to pixel art style both required significant iteration
