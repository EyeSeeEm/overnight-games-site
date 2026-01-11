# Iteration Log: High Tea V2 (Phaser)

## Reference Analysis
- Main colors: Teal water (#4a8a8a), sepia/tan land, cream UI panels
- Art style: Vintage period map aesthetic, early 19th century
- UI elements: Inventory panel, trade port markers, Britain's mood bar, tea order deadline
- Core features from GDD: Tea trading, opium smuggling, supply/demand, ship management, time pressure

## Base Iterations (1-10)

1. [Initial] Ported canvas version to Phaser 3
   - Used Phaser.CANVAS renderer for headless compatibility
   - Set up GameScene with create/update lifecycle

2. [Map] Created period-style China coast map
   - Teal water with slight gradient
   - Sepia/tan landmasses for China coast
   - Vintage cartographic style

3. [Ports] Implemented trade port system
   - Five ports: Lintin, Canton, Whampoa, Macao, Bocca Tigris
   - Port markers with speech bubble tooltips
   - Tea availability and pricing per port

4. [Inventory] Added left panel with cream background
   - Silver coins display
   - Opium chests count
   - Tea chests count
   - Buy buttons for opium/tea

5. [Trading] Buy/sell opium and tea mechanics
   - Dynamic pricing based on supply
   - Quantity buttons (5, 15, 30)
   - Profit calculation from arbitrage

6. [Timeline] Added top bar with month indicator
   - Year display (1830)
   - Colored dots for months
   - Progress through seasons

7. [Britain's Mood] Implemented happiness bar
   - Green bar shows satisfaction
   - Decreases over time without tea
   - Game over if mood hits zero

8. [Tea Orders] Deadline system with countdown
   - Required chest quantity
   - Timer showing minutes:seconds
   - Order panel at bottom of screen

9. [Ships] Added ship management
   - Ship icon in inventory
   - Visual sailing ship representation
   - Ship capacity limits

10. [Polish] Final visual touches
    - Rating stars on port tooltips
    - Consistent cream/sepia color scheme
    - Dark teal background border

## EXPAND Passes (11-30)

11. [Risk System] Port danger levels
    - 5-level risk indicator (1-5)
    - Colored dots on ports (green to red)
    - Risk increases with trade activity

12. [Capture System] Ship encounter outcomes
    - Escaped (60% of failures)
    - Fined (20% of failures)
    - Confiscated (15% of failures)
    - Captured (5% of failures)

13. [Bribe Cards] Corruption system
    - Random acquisition from corrupt officials
    - Can hold 1 bribe card maximum
    - Saves ship from capture

14. [Historical Events] Scripted events
    - 1832: "Orders Drying Up"
    - 1833: "Dealing Houses Merge"
    - 1836: "Commissioner Lin Appointed"
    - 1838: "Lin Arrives in Canton"
    - 1839: "Final Warning"

15. [Event Popups] Historical notifications
    - Centered popup with title/message
    - "UNDERSTOOD" dismiss button
    - Game effects on dismiss

16. [Hong Kong Port] Unlockable port
    - Unlocks in 1836+
    - Medium risk, good prices
    - Strategic late-game option

17. [Risk Escalation] Dynamic risk
    - Risk increases with trades (+0.3)
    - Large trades add extra risk (+0.5)
    - Risk decays over time

18. [Quota Bonuses] Exceeding quotas
    - +15 mood for meeting quota
    - +10 bonus for exceeding 120%
    - Extra ship reward

19. [Price System] Dynamic pricing
    - Year modifier (8% per year)
    - 1833+ opium spike (50%)
    - Random market noise

20. [News Ticker] Bottom news bar
    - Random news messages
    - Historical flavor text
    - Cycling every 15-25 seconds

21. [Victory Screen] Win condition
    - Full statistics display
    - Tea shipped, opium sold
    - Ships, fines, addictions

22. [Addiction Counter] Moral reckoning
    - ~3.5 addicts per opium chest
    - Displayed in end statistics
    - Historical context

23. [Score Calculation] Final scoring
    - Tea * 10 + Silver + Ships * 500
    - Addiction penalty (-2 per addict)
    - Displayed on victory

24. [Fleet Expansion] Ship rewards
    - +1 ship for meeting quota
    - Maximum 6 ships
    - Visual display of fleet

25. [Ship States] En route tracking
    - Available vs en route
    - Grayed out when sailing
    - Clear feedback

26. [Total Value] Offer display
    - Shows "Total: XXX silver"
    - Helps decision making
    - Calculated automatically

27. [Last Ship Warning] Safety check
    - Warns when risking last ship
    - High risk + 1 ship = warning
    - Prevents accidental loss

28. [Mood Recovery] Balance tuning
    - Slower mood decay (0.3/sec)
    - Meeting quota restores +15
    - Below 0 = game over

29. [1832 Event] Orders drying up
    - Reduced spawn rate in 1832
    - Fewer trade opportunities
    - Historical accuracy

30. [Risk Effects] Risk on events
    - 1836: All ports +1 risk
    - 1838: All ports +1 risk
    - Commissioner Lin crackdown

## POLISH Passes (31-50)

31. [Land Shadows] 3D depth effect
    - Darker offset layer behind land
    - All landmasses have shadows
    - Enhanced map depth

32. [Land Highlights] Texture detail
    - Lighter areas on land
    - Shows terrain variation
    - Better visual interest

33. [Port Hover] Selection feedback
    - Highlight on hover
    - Gold border effect
    - Clear selection state

34. [Offer Spawn] Scale animation
    - New offers scale from 0 to 1
    - Smooth appearance
    - Clear visual feedback

35. [Offer Bob] Floating animation
    - Offers bob up and down
    - Sine wave motion
    - Living feel

36. [Panel Shadow] UI depth
    - Shadow offset on panels
    - Cream panel elevation
    - Cleaner look

37. [Decorative Lines] Panel detail
    - Divider lines in panel
    - Section separation
    - Period typography feel

38. [Button Hover] UI feedback
    - Color change on hover
    - Clear interactive state
    - Consistent styling

39. [Screen Shake] Impact feedback
    - Camera shake on ship capture
    - Phaser camera system
    - Quick impactful effect

40. [Screen Flash] Event feedback
    - Red flash on danger
    - Green flash on success
    - Orange flash on warning

41. [Particles] Visual effects
    - Circle particles on events
    - Color-coded by type
    - Gravity and fade

42. [Floating Text] Value feedback
    - "+/-XXX" silver changes
    - Float upward animation
    - Color-coded

43. [Timer Urgency] Low time warning
    - Red color when <30 seconds
    - Larger font size
    - Clear urgency

44. [Progress Bar] Quota visual
    - Tea progress bar
    - Orange until full
    - Green when quota met

45. [Message Popup] Notification style
    - Gold border on messages
    - Dark semi-transparent bg
    - Centered display

46. [Timeline Polish] Year progression
    - Current year highlighted gold
    - Past years green
    - Future years gray

47. [Mood Meter Polish] Color transitions
    - Green > 60%
    - Orange 30-60%
    - Red < 30%

48. [Stats Panel] Victory screen
    - Full statistics layout
    - Clean line spacing
    - Score calculation

49. [News Polish] Ticker styling
    - Italic font
    - Scroll emoji prefix
    - Sepia color

50. [Risk Dots] Dynamic colors
    - Update on risk change
    - Green to red gradient
    - Clear danger indication

## Feature Verification
- [x] Period map of China coast
- [x] Multiple trading ports with prices
- [x] Opium and tea trading
- [x] Britain's mood/happiness meter
- [x] Tea order deadlines with countdown
- [x] Ship management with fleet
- [x] Dynamic supply and demand
- [x] Risk/capture system (4 outcomes)
- [x] Bribe card system
- [x] Historical events (5 events)
- [x] Victory/loss conditions
- [x] End game statistics
- [x] Addiction moral reckoning
- [x] Full visual polish

## Final Comparison
Game captures High Tea's core aesthetic:
- Vintage cartographic map style
- Teal water, sepia landmasses
- Cream-colored UI panels
- Period-appropriate typography
- Economic trading gameplay
- Historical narrative elements
- Risk/reward decision making
- Full Phaser effects (camera shake, tweens)

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Phaser graphics API rendered map beautifully
- Tweens made offer spawning animations smooth
- Event popup system using Phaser text worked cleanly
- Camera shake on ship capture added impact
- Timeline rendering with Phaser was precise

### What Went Wrong
- Map polygon drawing required careful coordinate planning
- Port interaction zones didn't align with visual positions initially
- Historical event timing was hard to balance with gameplay
- Memory management for text objects needed attention

### Key Learnings
- Plan map coordinates on paper first before coding
- Use Phaser containers for grouped UI elements
- Historical events should pace with player progress
- Destroy text objects immediately after use in update loop

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~35 minutes
- Polish passes: ~30 minutes
- Total: ~95 minutes

### Difficulty Rating
Medium - Map rendering took planning, but Phaser handled UI elements well

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Mechanics aren't very clear how to play"
   → Added full tutorial overlay explaining:
     - How to click trade offers
     - Buy opium with silver
     - Sell opium for silver and tea
     - Ship tea to meet quota
   → Added tips about risk levels and quota system

2. [x] "Need more/quicker resources to start trading"
   → Increased starting silver from 500 to 1000
   → Added 20 starting opium so players can trade immediately
   → Increased quota timer from 120 to 150 seconds

### Verification:
- Tutorial shows on game start with clear instructions
- Player starts with enough resources to begin trading right away
- Game pauses during tutorial until dismissed
- All feedback items addressed
