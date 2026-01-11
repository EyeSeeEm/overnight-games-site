# Iteration Log: Star of Providence Clone (Phaser)

## Reference Analysis
- Main colors: Dark navy background, brown/tan dungeon floor, green UI elements, orange bullets
- Art style: Pixel-art dungeon crawler, retro roguelike aesthetic
- UI elements: Health hearts, weapon charge bar, gold counter, floor/room indicator
- Core features from GDD: Top-down shooter, bullet hell patterns, room-based progression, enemy waves

## Base Iterations (1-10)

1. [Initial] Ported canvas version to Phaser 3
   - Used Phaser.CANVAS renderer for headless compatibility
   - Set up GameScene with create/update lifecycle
   - BootScene for texture generation

2. [Room] Created dungeon room structure
   - Checkerboard floor pattern
   - Brick wall perimeter
   - Door positions for room transitions

3. [Tiles] Pixel-art floor rendering
   - Graphics API for tile drawing
   - Alternating brown shades
   - Wall brick texture detail

4. [Player] Implemented player ship
   - Green triangle ship sprite
   - Mouse-aim rotation
   - Smooth WASD movement

5. [Shooting] Weapon firing system
   - Bullets toward cursor
   - Bullet pool management
   - Wall collision cleanup

6. [Enemies] Ghost enemy creatures
   - Blue circular ghost enemies
   - Eye detail rendering
   - Smooth chase behavior

7. [Bullet Patterns] Enemy attacks
   - Circular bullet sprays
   - Orange bullet projectiles
   - Pattern timing variation

8. [Health UI] Heart display system
   - Filled green hearts
   - Empty heart outlines
   - Damage feedback

9. [Weapon UI] Left panel charge bar
   - Green energy bar
   - Ammo indicator squares
   - Bordered container

10. [Score UI] Right panel stats
    - Multiplier display "x1.0"
    - Debris counter "0G"
    - Green bordered box

## EXPAND Passes (11-30)

11. [Drone Enemy] Patrolling enemy type
    - Cyan rectangular drone
    - Horizontal patrol movement
    - 4-directional bullet spray

12. [Turret Enemy] Stationary shooter
    - Purple hexagonal turret
    - Rotates toward player
    - 8-bullet ring pattern

13. [Charger Enemy] Rushing enemy
    - Orange square charger
    - Charges at player periodically
    - High speed attack

14. [Spawner Enemy] Minion spawning
    - Green circle spawner
    - Spawns ghost enemies over time
    - Rotating visual effect

15. [Boss Fight] Floor Guardian boss
    - Large circular boss
    - Multi-phase attacks
    - Health bar at top

16. [Wave System] Wave-based rooms
    - 5 waves per room
    - Enemy count scales
    - Wave indicator in UI

17. [Salvage System] Upgrade selection
    - "Choose One Salvage" screen
    - 3 random upgrade choices
    - Appears after room clear

18. [Damage Upgrades] +25% damage salvage
    - Multiplies player damage
    - Stacking effect
    - Visible in stats

19. [Speed Upgrades] +15% speed salvage
    - Increases movement speed
    - Both normal and focus speed
    - Noticeable difference

20. [Fire Rate] +20% fire rate salvage
    - More bullets per second
    - Quick firing builds
    - Spray and pray viable

21. [Multi-shot] +1 bullet salvage
    - Multiple bullets per shot
    - Spread pattern
    - High damage potential

22. [Homing Bullets] Tracking bullets
    - Bullets curve toward enemies
    - Quality of life upgrade
    - Great for chaotic rooms

23. [Piercing Bullets] Through enemies
    - Bullets pass through
    - 3 pierce count
    - Wave clear power

24. [Critical Hits] +10% crit chance
    - Double damage crits
    - Yellow damage numbers
    - Satisfying feedback

25. [Lifesteal] Heal on kills
    - Chance to heal
    - Green particle effect
    - Sustain builds

26. [Shield] Extra hit protection
    - Absorbs one hit
    - Blue visual indicator
    - Recharges between rooms

27. [Super Shot] Charge attack
    - Hold to charge
    - 7-bullet piercing burst
    - Screen shake on fire

28. [Bomb System] E key bomb
    - Clears all bullets
    - Damages all enemies
    - Orange screen flash

29. [Combo System] Kill chain multiplier
    - Kills within 2 seconds
    - Up to 5x multiplier
    - Affects debris drops

30. [Elite Enemies] Purple variants
    - 2x health and size
    - Purple tint effect
    - Double debris drops

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

43. [Dash Effect] Movement ability
    - Z key activation
    - 5 afterimage trail sprites
    - Green colored ghosts

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
- [x] Dash with afterimages
- [x] Super shot charge attack
- [x] Bomb screen clear
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
- Phaser's group management made enemy waves easy to handle
- Dash mechanic with afterimages looked great using Phaser sprites
- Camera shake on boss hits felt impactful
- Graphics API drawing was clean for dungeon tiles
- Time events for delayed spawns worked perfectly

### What Went Wrong
- Boss class initialization order caused "before initialization" error
- Had to move config to end of file after class definitions
- Bullet cleanup logic needed rework - bullets persisted through rooms
- Enemy targeting during dash caused unfair hits

### Key Learnings
- Define all classes before referencing them in Phaser config
- Use scene.physics.world.overlap for bullet-enemy collisions
- Clear bullet arrays on room transitions explicitly
- Dash should grant brief invincibility, not just speed

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~35 minutes
- Polish passes: ~25 minutes
- Total: ~90 minutes

### Difficulty Rating
Hard - Phaser class initialization quirks and bullet hell balancing both required iteration


---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Room transitions don't work correctly"
   → Root cause: selectSalvage() was calling scene.restart() without preserving state
   → Fixed by passing playerStats and gameState through init(data)
   → Room transitions now preserve all player upgrades and progress

2. [x] "Upgrade rooms only (salvage screen)"
   → Salvage screen now appears after clearing all 5 waves
   → Player selects an upgrade, then transitions to new room
   → Stats are preserved across rooms

3. [x] "Need minimap"
   → Added minimap in top-right corner (60x60 pixels)
   → Shows visited rooms (dim green) and current room (bright green)
   → Shows adjacent unvisited rooms (grey)
   → Updates as player progresses through rooms
   → Added roomsVisited array and currentRoomX/Y tracking

### Technical Implementation:
- Modified init(data) to accept preserved state from previous room
- Added roomsVisited 2D array for minimap tracking
- Added currentRoomX/Y for position tracking
- Created updateMinimap() function in HUD
- selectSalvage() now updates room position and passes state to restart

### Verification:
- Game loads without errors
- Room transitions work - player advances to Room 2 after clearing Room 1
- Player stats preserved (speed upgrade shows increased value)
- Minimap displays correctly with multiple visited rooms
- All waves must be cleared before salvage screen appears
