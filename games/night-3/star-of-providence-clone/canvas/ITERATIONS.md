# Iteration Log: Star of Providence Clone (Canvas)

## Reference Analysis
- Main colors: Dark navy background, brown/tan dungeon floor, green UI elements, orange bullets
- Art style: Pixel-art dungeon crawler, retro roguelike aesthetic
- UI elements: Health hearts, weapon charge bar, gold counter, floor/room indicator
- Core features from GDD: Top-down shooter, bullet hell patterns, room-based progression, enemy waves

## Base Iterations (1-10)

1. [Initial] Built basic dungeon room structure
   - Dark background with dungeon floor
   - Brick wall borders
   - Entry/exit door markers

2. [Floor] Created checkerboard dungeon pattern
   - Alternating dark/light brown tiles
   - Pixel-art brick texture on walls
   - Clean room boundaries

3. [Player] Implemented player ship
   - Small green triangular ship
   - WASD movement controls
   - Rotates toward mouse cursor

4. [Shooting] Auto-fire weapon system
   - Continuous fire toward cursor
   - Orange/red bullet projectiles
   - Bullet cleanup on wall collision

5. [Enemies] Added enemy creatures
   - Blue blob-like enemies with eyes
   - Different enemy types
   - Shadow effects beneath

6. [Enemy Bullets] Bullet hell patterns
   - Circular bullet patterns from enemies
   - Orange bullet rings
   - Pattern variation per enemy type

7. [UI - Health] Added heart health display
   - Green filled hearts (health)
   - Empty heart outlines (max health)
   - Positioned at top center

8. [UI - Weapon] Charge bar on left
   - Green rectangle with fill
   - Shows weapon energy
   - Small ammo counter squares

9. [UI - Score] Right panel with multiplier
   - "x1.0" multiplier display
   - Gold counter "0G"
   - Green bordered box

10. [UI - Room] Floor/room indicator
    - "FLOOR 1 - ROOM 1" text
    - "ENEMIES: X" counter
    - Bottom center position

## EXPAND Passes (11-30)

11. [Charger Enemy] Rushing enemy type
    - Charges at player periodically
    - High speed attack
    - Pink/magenta color

12. [Spawner Enemy] Minion spawning enemy
    - Spawns ghost enemies over time
    - Rotating orb design
    - Green color scheme

13. [Boss Fight] Floor Guardian boss
    - Large circular boss
    - Multi-phase attacks
    - Health bar at top

14. [Wave System] Wave-based rooms
    - 5 waves per room
    - Enemy count scales
    - Wave indicator in UI

15. [Salvage System] Upgrade selection
    - "Choose One Salvage" screen
    - 3 random upgrade choices
    - Appears after room clear

16. [Damage Upgrades] +25% damage salvage
    - Multiplies player damage
    - Stacking effect
    - Visible in stats

17. [Speed Upgrades] +15% speed salvage
    - Increases movement speed
    - Both normal and focus speed
    - Noticeable difference

18. [Fire Rate] +20% fire rate salvage
    - More bullets per second
    - Quick firing builds
    - Spray and pray viable

19. [Multi-shot] +1 bullet salvage
    - Multiple bullets per shot
    - Spread pattern
    - High damage potential

20. [Homing Bullets] Tracking bullets
    - Bullets curve toward enemies
    - Quality of life upgrade
    - Great for chaotic rooms

21. [Piercing Bullets] Through enemies
    - Bullets pass through
    - 3 pierce count
    - Wave clear power

22. [Critical Hits] +10% crit chance
    - Double damage crits
    - Yellow damage numbers
    - Satisfying feedback

23. [Lifesteal] Heal on kills
    - Chance to heal
    - Green particle effect
    - Sustain builds

24. [Shield] Extra hit protection
    - Absorbs one hit
    - Blue visual indicator
    - Recharges between rooms

25. [Super Shot] Charge attack
    - Hold RMB to charge
    - 7-bullet piercing burst
    - Screen shake on fire

26. [Bomb System] E key bomb
    - Clears all bullets
    - Damages all enemies
    - Screen flash effect

27. [Elite Enemies] Purple variants
    - 2x health and size
    - Purple glow effect
    - Double debris drops

28. [Combo System] Kill chain multiplier
    - Kills within 2 seconds
    - Up to 5x multiplier
    - Affects debris drops

29. [Boss Phases] Multi-phase boss
    - Phase 2 at 60% HP
    - Phase 3 at 30% HP
    - Faster attacks per phase

30. [Homing Enemy Bullets] Boss specialty
    - Pink homing missiles
    - Curve toward player
    - Requires dodging skill

## POLISH Passes (31-50)

31. [Muzzle Flash] Weapon effects
    - Yellow particle on fire
    - Quick decay
    - Satisfying feedback

32. [Screen Shake] Impact feedback
    - Shake on player hit
    - Shake on enemy death
    - Larger shake on boss

33. [Damage Numbers] Hit feedback
    - Numbers float up
    - Yellow for crits
    - Size varies by damage

34. [Hit Flash] Enemy damage
    - White flash on hit
    - Clear hit registration
    - Works on all enemies

35. [Death Particles] Enemy explosions
    - 12 particles per enemy
    - Color matches enemy
    - Spreads outward

36. [Screen Flash] Damage effect
    - Red flash on player hit
    - Orange flash on bomb
    - Blue flash on shield

37. [Player Trail] Movement effect
    - Ghost trail when moving
    - Green colored
    - Fades over time

38. [Pickup Magnet] Collection QoL
    - Pickups pulled to player
    - 100px radius
    - Smooth acceleration

39. [Pickup Bob] Visual polish
    - Sine wave floating
    - Individual timing
    - Attractive appearance

40. [Engine Glow] Player animation
    - Pulsing engine flame
    - Color changes in focus
    - Shows movement state

41. [Focus Mode] Visual indicator
    - Pink hitbox circle
    - Pink engine color
    - Smaller hitbox

42. [Charge Visual] Super shot feedback
    - Growing arc around player
    - Orange color
    - Ready flash at full

43. [Dash Particles] Movement effect
    - 8 particles on dash
    - Green colored
    - Spreads outward

44. [Shield Visual] Protection indicator
    - Circle around player
    - Cyan colored
    - Multiple for stacks

45. [Combo Display] Kill chain UI
    - "Nx COMBO" text
    - Orange colored
    - Centered on screen

46. [Key Hints] Input help
    - Bottom of screen
    - All controls listed
    - Gray color (subtle)

47. [Boss Health Bar] UI element
    - 400px wide at top
    - "FLOOR GUARDIAN" name
    - Red fill color

48. [Salvage Hover] Selection feedback
    - Green border on hover
    - Background highlight
    - Number key hints

49. [Wave Indicator] UI addition
    - "WAVE X/5" in footer
    - Updates per wave
    - Clear progress

50. [Floor Display] Progression UI
    - Shows current floor
    - Updates every 5 rooms
    - Sense of progress

## Feature Verification
- [x] Top-down shooter mechanics
- [x] Dungeon room with walls
- [x] Multiple enemy types (5 types + elite + boss)
- [x] Bullet hell patterns
- [x] Health heart system
- [x] Weapon charge/ammo
- [x] Room progression with waves
- [x] Boss fights
- [x] Salvage upgrade system
- [x] 10 unique upgrades
- [x] Combo multiplier
- [x] Full visual polish

## Final Comparison
Game captures Star of Providence's core aesthetic:
- Dark dungeon atmosphere
- Pixel-art enemy designs
- Green UI color scheme
- Bullet hell combat
- Roguelike room-by-room progression
- Salvage/upgrade system
- Boss encounters
- Full polish pass

**40 iterations complete - 20 EXPAND + 20 POLISH**

## Post-Mortem

### What Went Well
- Dungeon room rendering was visually striking from early iterations
- Bullet hell patterns created satisfying chaos
- Salvage upgrade system added replayability depth
- Wave-based progression gave clear goals
- Boss fight phases kept encounters interesting

### What Went Wrong
- Bullet collision with walls was initially inconsistent
- Enemy spawn positions sometimes overlapped with player
- Charger enemy pathfinding was too direct, felt unfair
- Performance dropped with too many bullets on screen

### Key Learnings
- Limit active bullet count with pooling - 200 max worked well
- Give players invincibility frames after taking damage
- Use polar coordinates for circular bullet patterns - much cleaner code
- Room transitions need visual feedback to feel intentional

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~35 minutes
- Polish passes: ~30 minutes
- Total: ~90 minutes

### Difficulty Rating
Medium-Hard - Bullet hell patterns require careful balancing to feel challenging but fair

---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Enemies just keep coming in same room even when cleared" → Changed to door-based progression
2. [x] "Player should have to move to next rooms and clear the level" → Added door system for room transitions
3. [x] "Enemies need short stun time ~500ms when player enters a room" → Added game.enemyStunTimer

### Implementation Details:

**Room-Based Progression:**
- Changed wave clearing to open doors instead of auto-spawning next wave
- Reduced maxWave from 5 to 3 for faster room-based progression
- When all enemies are killed, `game.roomCleared = true` and doors open
- Player walks through doors (within 50px) to transition to next room

**Door System:**
- Added `openRoomDoors()`: Creates 2-3 randomly positioned doors (north/south/east/west)
- Added `drawDoors()`: Draws glowing green doors with directional arrows
- Added `checkDoorTransition()`: Detects player entering door zones
- Added `transitionToNextRoom()`: Handles screen flash, player repositioning, wave progression

**Enemy Stun Timer:**
- Added `game.enemyStunTimer = 0.5` (500ms) when entering new room
- Enemies don't update during stun period, giving player time to react
- Applied after room transitions and after salvage screen

### Code Changes:
```javascript
// Added state variables
roomCleared: false,
doors: [],
transitioning: false,
enemyStunTimer: 0

// Enemy update gated by stun timer
if (game.enemyStunTimer > 0) {
    game.enemyStunTimer -= dt;
} else {
    updateEnemies(dt);
}

// Doors open when room cleared
if (enemies.length === 0 && !game.roomCleared) {
    game.roomCleared = true;
    openRoomDoors();
}
```

### Verification:
- Enemies no longer auto-spawn after wave clear
- Doors appear when all enemies killed
- Player can walk through doors to next room
- 500ms stun gives breathing room on room entry

**Total Iterations Logged:** 43+ (20 expand + 20 polish + 3 feedback fixes)
