# Iteration Log: Curious Expedition Clone (Phaser)

## Reference Analysis
- Main colors: Parchment (#F5E6D3), leather brown (#8B4513), button dark (#4A3728), gold accent (#D4A84B)
- Art style: 16-bit pixel art, Victorian journal aesthetic
- UI elements: Left journal panel, right scene panel, day counter, sanity bar, choice buttons
- Core features from GDD: Hex exploration, sanity system, location events, party management

## Base Iterations (1-10)

1. [Initial] Ported Canvas code to Phaser graphics API
   - DIFF: Graphics API differences (fillPath vs fill)
   - FIX: Updated all drawing calls to use Phaser's graphics methods

2. [Text Rendering] Fixed text display using Phaser text objects
   - DIFF: Canvas ctx.fillText not available in Phaser graphics
   - FIX: Use scene.add.text() with delayed destroy

3. [Shapes] Adapted shape drawing
   - DIFF: Phaser uses fillTriangle, fillCircle, fillEllipse differently
   - FIX: Updated all shape drawing to use correct Phaser methods

4. [Event System] Verified event scenes render correctly
   - Tested village, camp, shrine, cave, oasis, pyramid scenes

5. [UI Elements] Decorative corner brackets on buttons
   - Used Phaser's beginPath/lineTo/strokePath for corners

6. [Mini-map] Implemented map overlay with Phaser graphics
   - Shows fog of war, terrain colors, party position

7. [Camp Scene] Night scene with campfire glow
   - Stars, moon, tree silhouettes, fire glow effect

8. [Input Handling] Click handling for navigation and choices
   - Movement by clicking scene area
   - Choice buttons responsive

9. [Status Bar] Party icons and sanity bar
   - Health dots per party member
   - Color-coded sanity bar

10. [Polish] Final visual comparison with reference
    - Matches original's journal aesthetic
    - Event scenes capture pixel art style

## EXPAND Passes (11-30)

11. [Ruins Location] Ancient ruins location type
    - Crumbling stone columns and arches scene
    - Search thoroughly or quick search choices
    - Artifact discovery with fame bonus

12. [Trading Post] Trading post location
    - Building with sign and barrels
    - Buy supplies, sell treasures, rest
    - Fame-based economy system

13. [Waterfall Location] Hidden waterfall location
    - Animated water effect on cliff
    - Mist particles at base
    - Hidden treasure behind falls

14. [Weather System] Dynamic weather effects
    - Clear, cloudy, rainy, foggy types
    - Weather affects travel cost
    - Visual rain and fog overlays

15. [Swamp Terrain] New swamp terrain type
    - Higher sanity cost to traverse
    - Sickness chance when crossing
    - Darker green color on minimap

16. [Animal Attack Event] Wildlife encounters
    - Fight, flee, or distract choices
    - Combat success/failure outcomes
    - Party member injury risk

17. [Native Encounter] Meeting native tribes
    - Gift, communicate, or retreat options
    - Scout translation bonus
    - Sanity rewards for diplomacy

18. [Treasure Event] Random treasure finds
    - Dig it up or check for traps
    - Fame bonus for discovery
    - Treasure counter tracking

19. [Sickness Event] Disease mechanics
    - Use medicine or rest choices
    - Party members can be weakened
    - Press on at sanity cost

20. [Portal Event] Mysterious portals
    - Enter portal for teleportation
    - Study for knowledge bonus
    - Animated swirling visuals

21. [Achievement System] Track accomplishments
    - Pyramid Found - first discovery
    - Seasoned Explorer - 5 expeditions
    - Treasure Hunter - 10 treasures
    - Survivor - finish with <10 sanity

22. [Blessing System] Positive party buffs
    - Shrine blessings available
    - Swift blessing reduces travel cost
    - Visual golden flash effect

23. [Curse System] Negative party effects
    - Shrine curse possibility
    - Increases travel cost
    - Screen shake on curse

24. [Party Abilities] Unique member skills
    - Leadership - explorer default
    - Pathfinding - scout reveals more
    - Carrying - donkey inventory

25. [Inventory System] Item management
    - Torch, rope, whiskey, medicine
    - Food for animal distraction
    - Treasures for selling

26. [Expedition Stats] End-of-expedition summary
    - Days traveled
    - Fame earned
    - Expeditions counter

27. [Hire Guide] Village hire option
    - Trade item for new party member
    - Additional pathfinding ability
    - Party expansion mechanic

28. [Low Sanity Event] Madness mechanics
    - Take break, drink whiskey, push through
    - Triggered when sanity < 30
    - Sanity recovery options

29. [Stories By Fire] Camp storytelling
    - Small sanity boost option
    - Additional night camp choice
    - Party morale building

30. [Scout Cave] Scout ability use
    - Send scout ahead for safety
    - Guaranteed treasure if scout available
    - Ability-gated content

## POLISH Passes (31-50)

31. [Screen Shake] Impact feedback
    - Shake on combat events
    - Shake on negative outcomes
    - Phaser camera shake system

32. [Screen Flash] Visual alerts
    - Red flash on damage
    - Gold flash on treasure
    - Purple flash on portal

33. [Floating Text] Feedback numbers
    - "+20 Sanity" popups
    - "-1 Health" indicators
    - Fame amount changes

34. [Particle Effects] Environmental particles
    - Campfire sparks rising
    - Pyramid sparkles
    - Waterfall mist

35. [Animated Trees] Living environment
    - Trees sway with treeSwayTime
    - Wind effect on foliage
    - Natural movement feel

36. [Button Hover] UI feedback
    - Color change on hover
    - selectedChoice tracking
    - Clear interactive state

37. [Sanity Bar Animation] Smooth transitions
    - Pulsing red when critical
    - Color shifts by level
    - Visual urgency

38. [Minimap Animation] Map polish
    - Pulsing party position
    - Red/light red alternating
    - Clear location indicator

39. [Weather Indicator] UI addition
    - Weather icon top-right
    - Updates every 30 seconds
    - Clear weather feedback

40. [Campfire Animation] Fire effects
    - Flickering fire height
    - Glow size pulsing
    - Spark particles

41. [Portal Animation] Swirl effects
    - Pulsing portal size
    - Orbiting particles
    - Mystical atmosphere

42. [Water Ripple] Oasis effects
    - Rippling water size
    - Animated pool
    - Smooth sine wave

43. [Star Twinkle] Night sky
    - Stars alpha variation
    - Based on treeSwayTime
    - Nighttime atmosphere

44. [Torch Flicker] Cave lighting
    - Variable torch glow size
    - Flickering light radius
    - Dark cave ambiance

45. [Shrine Glow] Mystical effects
    - Pulsing altar glow
    - Golden light variation
    - Sacred atmosphere

46. [Victory Confetti] Celebration
    - Multi-colored particles
    - Spawning from top
    - Gravity-affected fall

47. [Stats Display] Game over/victory
    - Days, fame, expeditions
    - Centered text display
    - Clear summary

48. [Blessing/Curse UI] Status display
    - Shows count in status bar
    - Party effect tracking
    - Clear buff/debuff info

49. [Class Structure] Code organization
    - BootScene + GameScene
    - Clean separation
    - Proper initialization order

50. [Performance] Optimizations
    - Particle array management
    - Floating text cleanup
    - Memory-efficient updates

## Feature Verification
- [x] Journal panel with parchment texture
- [x] Day counter updates
- [x] Sanity bar decreases with travel
- [x] Party member icons with health dots
- [x] Location events with multiple choices
- [x] Event scenes (village, shrine, pyramid, cave, oasis, camp, ruins, tradingPost, waterfall, portal)
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
- Full Phaser effects (camera shake, tweens)
- Animated environments and particles

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Phaser camera shake for negative events felt impactful
- Graphics API handled pixel art scene rendering well
- Event popup system was cleanly structured
- Particle effects for portal and campfire added atmosphere
- Tween animations for UI elements were smooth

### What Went Wrong
- Class initialization order caused "Cannot access before initialization" error
- Had to restructure file to define classes before config
- Text rendering for journal entries needed careful line wrapping
- Large scene drawing functions became unwieldy

### Key Learnings
- Always define Phaser scene classes at top of file
- Move const config and new Phaser.Game() to end of file
- Break complex drawing into smaller helper functions
- Use Phaser text wordWrap for long descriptions

### Time Spent
- Initial build: ~35 minutes
- Expand passes: ~40 minutes
- Polish passes: ~30 minutes
- Total: ~105 minutes

### Difficulty Rating
Hard - Phaser class ordering issues and complex scene rendering both required debugging
