# Iteration Log: High Tea V2 (Canvas)

## Reference Analysis
- Main colors: Teal water (#4a8a8a), sepia/tan land, cream UI panels
- Art style: Vintage period map aesthetic, early 19th century
- UI elements: Inventory panel, trade port markers, Britain's mood bar, tea order deadline
- Core features from GDD: Tea trading, opium smuggling, supply/demand, ship management, time pressure

## Base Iterations (1-10)

1. [Initial] Built basic map layout
   - Canvas setup with teal water background
   - Dark border around game area
   - Basic coordinate system

2. [Map] Created China coast geography
   - Sepia/tan landmasses
   - Coastline shapes matching reference
   - Islands and mainland

3. [Ports] Added trading port markers
   - Five ports: Lintin, Canton, Whampoa, Macao, Bocca Tigris
   - White circular markers
   - Port name labels

4. [Tooltips] Port information popups
   - Speech bubble style
   - Tea chest availability
   - Price per chest
   - Star rating for demand

5. [Inventory Panel] Left side cream panel
   - Silver coins counter
   - Opium chests owned
   - Tea chests owned
   - Clean vintage typography

6. [Trading] Buy buttons for goods
   - "BUY OPIUM" section with price
   - "BUY TEA" section with price
   - Quantity buttons (5, 15, 30)

7. [Ships] Ship management section
   - Ship icon in inventory
   - Sailing ship visual
   - Capacity indication

8. [Timeline] Month/year display
   - "1830" year label
   - Colored dots for months
   - Progress indication

9. [Britain's Mood] Happiness bar
   - Green fill bar
   - "BRITAIN'S MOOD" label
   - Decreases without tea delivery

10. [Tea Orders] Deadline panel
    - "TEA ORDER: X chests" requirement
    - "Your tea: X chests" current amount
    - Countdown timer (M:SS format)

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

14. [Bribe Dialog] Choice popup
    - "USE BRIBE CARD" or "ACCEPT FATE"
    - Styled popup window
    - Strategic decision making

15. [Historical Events] Scripted events
    - 1832: "Orders Drying Up"
    - 1833: "Dealing Houses Merge"
    - 1836: "Commissioner Lin Appointed"
    - 1839: "Final Warning"

16. [Event Popups] Historical notifications
    - Centered popup with title/message
    - "UNDERSTOOD" dismiss button
    - Game effects on dismiss

17. [Hong Kong Port] Unlockable port
    - Unlocks in 1836+
    - Medium risk, good prices
    - Strategic late-game option

18. [Risk Escalation] Dynamic risk
    - Risk increases with trades (+0.3)
    - Large trades add extra risk (+0.5)
    - Risk decays over time

19. [Quota Bonuses] Exceeding quotas
    - +15 mood for meeting quota
    - +10 bonus for exceeding 120%
    - Extra ship reward

20. [Price System] Dynamic pricing
    - Year modifier (8% per year)
    - 1833+ opium spike (50%)
    - Random market noise

21. [News Ticker] Bottom news bar
    - Random news messages
    - Historical flavor text
    - Cycling every 15-25 seconds

22. [Victory Screen] Win condition
    - Full statistics display
    - Tea shipped, opium sold
    - Ships, fines, addictions

23. [Addiction Counter] Moral reckoning
    - ~3.5 addicts per opium chest
    - Displayed in end statistics
    - Historical context note

24. [Score Calculation] Final scoring
    - Tea * 10 + Silver + Ships * 500
    - Addiction penalty (-2 per addict)
    - Displayed on victory

25. [Fleet Expansion] Ship rewards
    - +1 ship for meeting quota
    - Maximum 6 ships
    - Visual display of fleet

26. [Ship States] En route tracking
    - Available vs en route
    - Grayed out when sailing
    - Clear feedback

27. [Total Value] Offer display
    - Shows "Total: XXX silver"
    - Helps decision making
    - Calculated automatically

28. [Last Ship Warning] Safety check
    - Warns when risking last ship
    - High risk + 1 ship = warning
    - Prevents accidental loss

29. [Mood Recovery] Balance tuning
    - Slower mood decay (0.3/sec)
    - Meeting quota restores +15
    - Below 0 = game over

30. [1832 Event] Orders drying up
    - Reduced spawn rate in 1832
    - Fewer trade opportunities
    - Historical accuracy

## POLISH Passes (31-50)

31. [Animated Waves] Sea motion
    - Elliptical wave shapes
    - Sine/cosine animation
    - Subtle parallax effect

32. [Land Shadows] 3D depth
    - Darker shadow offset (5px)
    - All landmasses
    - Enhanced map depth

33. [Land Highlights] Texture detail
    - Lighter areas on land
    - Shows terrain variation
    - Better visual interest

34. [Port Pulse] Active offers
    - Ports pulse when offer active
    - Size oscillation
    - Yellow highlight color

35. [Risk Glow] Danger indicator
    - Red glow at risk 4+
    - Orange glow at risk 3
    - Pulsing animation

36. [Offer Spawn Animation] Scale in
    - New offers scale from 0
    - Smooth appearance
    - Clear visual feedback

37. [Offer Hover] Selection feedback
    - Brighter on hover
    - Gold border highlight
    - Thicker stroke

38. [Ship Trail] Movement effect
    - Wake trail behind ships
    - Fading alpha
    - Shows ship path

39. [Ship Shadow] Visual depth
    - Ellipse shadow below ship
    - Shows water level
    - 3D illusion

40. [Sail Animation] Ship detail
    - Billowing sail effect
    - Sine wave animation
    - Dynamic movement

41. [Panel Shadow] UI depth
    - Shadow offset on panels
    - Cream panel elevation
    - Cleaner look

42. [Decorative Lines] Panel detail
    - Divider lines in panel
    - Section separation
    - Period typography feel

43. [Button Hover] UI feedback
    - Shadow on hover
    - Color change
    - Thicker border

44. [Screen Shake] Impact feedback
    - Shake on ship capture
    - Intensity varies
    - Quick decay

45. [Screen Flash] Event feedback
    - Red flash on danger
    - Green flash on success
    - Orange flash on warning

46. [Particles] Visual effects
    - Burst on purchase
    - Burst on ship return
    - Color-coded

47. [Floating Text] Value feedback
    - "+/-XXX" silver changes
    - Float upward animation
    - Color-coded (+green, -red)

48. [Timer Urgency] Low time warning
    - Red color when <30 seconds
    - Pulsing panel flash
    - Larger font size

49. [Progress Bar] Quota visual
    - Tea progress bar
    - Orange until full
    - Green when quota met

50. [Message Popup] Notification style
    - Gold border on messages
    - Dark semi-transparent bg
    - Centered display

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
- Full juice and polish

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Not clear what the mechanics are" → Added step-by-step tutorial system
   - Tutorial welcomes player and explains the trading loop
   - Step 1: Buy opium with silver (highlighted button)
   - Step 2: Sell opium at ports (highlighted map offers)
   - Step 3: Wait for ship to return with silver
   - Step 4: Buy tea with silver (highlighted button)
   - Step 5: Tea shipped when clipper arrives (highlighted quota panel)
   - Final summary of gameplay loop
2. [x] "Start simple with resources" → Player now starts with 15 opium chests
3. [x] Tutorial uses visual highlights (yellow rectangles) to guide player
4. [x] Tutorial darkens non-relevant areas to focus attention

### Verification:
- Tutorial displays correctly on game start ✓
- Click-to-advance works for text steps ✓
- Action triggers (buy, sell, etc.) advance tutorial ✓
- Highlights correctly point to relevant UI elements ✓

---

## Post-Mortem

### What Went Well
- Period map aesthetic was immediately recognizable
- Economic trading loop was engaging from first iteration
- Historical events added narrative depth and variety
- Risk system created meaningful tension in decisions
- Addiction counter provided moral weight to gameplay

### What Went Wrong
- Initial price balancing made opium too profitable
- Timer countdown felt too punishing on first pass
- Port hover detection was finicky with irregular shapes
- Year progression felt too fast initially

### Key Learnings
- Economic games need careful tuning - small price changes have big impacts
- Visual feedback on trades (floating text) is essential for satisfaction
- Historical accuracy adds authenticity even in simplified form
- Risk escalation should be gradual, not sudden

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~40 minutes
- Polish passes: ~30 minutes
- Total: ~95 minutes

### Difficulty Rating
Medium - Economic balancing was trickier than expected, but mechanics were straightforward
