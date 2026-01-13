# Iterations Log - Star of Providence Clone

## Initial Implementation

### Features Implemented
- **Player Movement**: 8-directional movement with WASD/Arrow keys
- **Focus Mode**: Hold Shift for precise slow movement with visible hitbox
- **Dash System**: Z key dash with i-frames and cooldown indicator
- **Shooting System**: Space/Click to fire, automatic fire rate
- **Bomb System**: X key to clear bullets and damage enemies
- **Health System**: HP hearts, shields, invincibility on hit
- **Multiplier System**: Kill chain multiplier for debris rewards

### Weapons Implemented
- Peashooter (infinite ammo default)
- Vulcan (rapid fire)
- Laser (piercing)
- Fireball (explosive)
- Sword (melee + projectile)

### Enemies Implemented
- Ghost (chase behavior)
- Drone (dash + spread attack)
- Turret (stationary, aimed shots)
- Seeker (wander + spread attack)
- Swarmer (fast chase, no attack)
- Pyromancer (wander, fireball attack)
- Blob (bounce, splits on death)

### Bosses Implemented
- Chamberlord (teleport, spread/ring attacks, phase transition)
- Guardian (slow chase, aimed/spread attacks)

### Room System
- Procedural floor generation
- Room types: start, normal, miniboss, boss, shop, upgrade
- Door connections and navigation
- Room clearing mechanics

### UI Implemented
- Health display (hearts)
- Shield display
- Bomb counter
- Weapon name and ammo bar
- Multiplier display
- Debris counter
- Floor and room counter
- Dash cooldown indicator
- Control hints
- Map overlay (TAB)

### Test Harness
- Full test harness integration
- Debug commands implemented
- Vision/state reporting
- Action execution

---

## Iteration Log

### Iteration 1: Damage numbers floating above enemies
- **Feature**: Floating damage numbers when enemies take damage
- **Implementation**:
  - Added `damageNumbers` array and `createDamageNumber()` function
  - Damage numbers float upward with fade-out effect
  - Yellow for normal damage, red for crits (50+ damage)
  - Scale effect for visual impact
- **Files Modified**: game.js
- **Test Result**: PASS - damage numbers appear and fade correctly

### Iteration 2: Muzzle flash effect when firing
- **Feature**: Visual muzzle flash at bullet spawn point
- **Implementation**:
  - Added `muzzleFlashes` array and `createMuzzleFlash()` function
  - Two-layer effect: colored outer glow + white inner core
  - Brief duration (50ms) for rapid flash effect
  - Color matches weapon projectile color
- **Files Modified**: game.js
- **Test Result**: PASS - muzzle flashes appear without errors

### Iteration 3: Player thruster animation
- **Feature**: Visual thruster flame while player moves
- **Implementation**:
  - Two-layer flame effect (orange outer, yellow inner)
  - Flicker animation using sine wave
  - Only appears when movement keys held
  - Added dash trail effect when dashing
- **Files Modified**: game.js
- **Test Result**: PASS - thruster flame visible when moving

### Iteration 4: Focus mode visual indicator
- **Feature**: Pulsing glow effect when in focus mode
- **Implementation**:
  - Outer white glow with pulsing alpha
  - Inner green glow matching player color
  - Thicker hitbox circle with center dot
  - Smooth sine wave pulse animation
- **Files Modified**: game.js
- **Test Result**: PASS - glow visible when Shift held

### Iteration 5: Room clear celebration effect
- **Feature**: Visual celebration when room is cleared
- **Implementation**:
  - "ROOM CLEARED!" text flash with scale animation
  - Particle burst from room center (green)
  - Particle burst from player position (yellow)
  - Screen shake on clear
- **Files Modified**: game.js
- **Test Result**: PASS - celebration plays on room clear

### Iteration 6: Bomb explosion visual effect
- **Feature**: Expanding ring effect when bomb is used
- **Implementation**:
  - Added `bombExplosions` array and `createBombExplosion()` function
  - Dual ring effect: magenta outer + white inner
  - Fast initial expansion with fade out
  - Inner glow fill effect
- **Files Modified**: game.js
- **Test Result**: PASS - explosion ring appears on bomb use

### Iteration 7: Bullet trail effects
- **Feature**: Trailing effect behind player bullets
- **Implementation**:
  - Fading trail circles behind bullet
  - White glow core on main bullet
  - Trail length and spacing configurable
- **Files Modified**: game.js
- **Test Result**: PASS - bullet trails visible when firing

### Iteration 8: Weapon pickup system
- **Feature**: Collectible weapon pickups
- **Implementation**:
  - Added 'weapon' pickup type with weapon switching
  - Debug command to spawn weapon pickups
  - Celebration particles on weapon collection
  - Ammo refilled to weapon's max on pickup
- **Files Modified**: game.js
- **Test Result**: PASS - weapon changes to Vulcan after pickup

### Iteration 9: Improved enemy death animation
- **Feature**: Enhanced death particle effects
- **Implementation**:
  - More particles on death (20 normal, 50 for bosses)
  - White flash particles
  - Yellow debris particles
- **Files Modified**: game.js
- **Test Result**: PASS - more particles visible on enemy death

### Iteration 10: Pause menu
- **Feature**: Pause game with ESC key
- **Implementation**:
  - ESC toggles between playing/paused states
  - Dark overlay with PAUSED title
  - Shows stats: floor, rooms, weapon, debris
  - Control instructions displayed
- **Files Modified**: game.js
- **Test Result**: PASS - pause menu appears and game resumes correctly

### Iteration 11: Enhanced screen shake with intensity variation
- **Feature**: Screen shake scales with damage amount, red hit flash effect
- **Implementation**:
  - Added hitFlashTimer variable for red overlay
  - Screen shake duration: 150 + (damage * 50)ms
  - Screen shake intensity: 5 + (damage * 4) pixels
  - Red flash overlay with fade-out effect
  - Intensity capped at 3 damage for scaling
- **Files Modified**: game.js
- **Test Result**: PASS - screen shake and red flash work correctly

### Iteration 12: Pickup magnet effect with smooth interpolation
- **Feature**: Pickups smoothly accelerate towards player
- **Implementation**:
  - Added velocity (vx, vy) and magnetStrength to pickups
  - 150px magnet radius with cubic easing
  - Smooth acceleration up to 500px/s max speed
  - Yellow glow effect on magnetized pickups
  - Particle trail when moving fast
  - Friction applied outside magnet range
- **Files Modified**: game.js
- **Test Result**: PASS - pickups smoothly attracted to player

### Iteration 13: Enemy spawn animation
- **Feature**: Enemies rise from ground with fade-in effect
- **Implementation**:
  - Added spawnTimer (400ms) and spawning state to Enemy class
  - Rising animation with vertical offset
  - Fade-in with scale effect (50% to 100%)
  - Purple portal/shadow effect under spawning enemy
  - Enemies don't move/attack while spawning
- **Files Modified**: game.js
- **Test Result**: PASS - no errors during spawn

### Iteration 14: Enhanced hit flash effect on enemies
- **Feature**: More impactful visual feedback when enemies take damage
- **Implementation**:
  - White hit particles on damage (scales with damage amount)
  - White glow effect around enemy during flash
  - Scale bump effect (up to 15% larger)
  - Stored lastHitDamage for potential use
- **Files Modified**: game.js
- **Test Result**: PASS - enhanced hit flash works correctly

### Iteration 15: Dash trail effect
- **Feature**: Player leaves afterimage trail when dashing
- **Implementation**:
  - Added dashTrails array for afterimage positions
  - Green afterimages with fade-out and scale-down
  - Green dash particles with random spread
  - Afterimages drawn before player for depth
  - updateDashTrails() and drawDashTrails() functions
- **Files Modified**: game.js
- **Test Result**: PASS - dash trail renders correctly

### Iteration 16: Boss phase transition effects
- **Feature**: Dramatic visual effects on boss phase change
- **Implementation**:
  - Added phaseFlashTimer for white screen flash
  - 40-particle radial burst from boss in boss color
  - 15 white flash particles
  - Ring expansion effect (reusing bomb explosion system)
  - Stronger screen shake (intensity 12, 500ms)
  - Test harness event logging for phase changes
- **Files Modified**: game.js
- **Test Result**: PASS - phase transition effects work correctly

### Iteration 17: Wraith enemy
- **Feature**: New enemy type with horizontal hovering and charge attack
- **Implementation**:
  - Added WRAITH to ENEMIES: hp 100, debris 45, speed 120
  - Horizontal_hover behavior: moves side-to-side with vertical bob
  - Spread attack: 5 bullets in 45-degree spread
  - Charge attack: locks onto player, brief pause, then 400px/s charge
  - Purple color (#6644aa), undead type
  - performCharge() method with particles
- **Files Modified**: game.js
- **Test Result**: PASS - Wraith spawns and functions correctly

### Iteration 18: Charge weapon
- **Feature**: Hold-to-charge weapon with burst release
- **Implementation**:
  - Added CHARGE to WEAPONS: 200 ammo, 1500ms max charge
  - Base damage 20, max charge damage 200
  - Projectile size scales 8 to 24 with charge
  - Visual charge indicator with pulsing glow and ring
  - Charge release particles and screen shake at full charge
  - Modified firePlayerWeapon() for charge scaling
  - Added player.chargeTime and player.isCharging states
- **Files Modified**: game.js
- **Test Result**: PASS - Charge weapon functions correctly

### Iteration 19: Heavy Turret enemy variants
- **Feature**: Four color-coded Heavy Turret variants with unique attacks
- **Implementation**:
  - HEAVY_TURRET_BLUE: spread attack (5 bullets, 60° arc)
  - HEAVY_TURRET_GREEN: rapid aimed shots (400ms cooldown)
  - HEAVY_TURRET_ORANGE: burst spread (3 bullets, high damage)
  - HEAVY_TURRET_PURPLE: ring attack (12 bullets)
  - All variants: 150-220 HP, size 28, stationary
- **Files Modified**: game.js
- **Test Result**: PASS - All 4 turret variants spawn correctly

### Iteration 20: Railgun weapon
- **Feature**: High-damage piercing weapon with slow fire rate
- **Implementation**:
  - Added RAILGUN to WEAPONS: 30 ammo, 1500ms fire rate
  - 250 damage, pierces all enemies (piercing: true)
  - 1500px/s velocity for fast projectiles
  - Cyan color (#88ffff)
- **Files Modified**: game.js
- **Test Result**: PASS - Railgun fires with piercing enabled

### Iteration 21: Mimic enemy
- **Feature**: Enemy that mirrors player movement and fires vulcan bursts
- **Implementation**:
  - Added MIMIC to ENEMIES: 130 hp, 70 debris, 180 speed
  - mirror_player behavior: positions opposite to player across room center
  - vulcan_burst attack: 8 rapid bullets with slight spread, 3500ms cooldown
  - Added fireVulcanBurst() method with staggered bullet firing (60ms intervals)
  - Magenta color (#ff88ff), construct type
- **Files Modified**: game.js
- **Test Result**: PASS - Mimic spawns, mirrors player position, fires vulcan burst

### Iteration 22: Cryomancer enemy
- **Feature**: Ice mage enemy that slows the player
- **Implementation**:
  - Added CRYOMANCER to ENEMIES: 120 hp, 85 debris, 50 speed
  - Two attacks: ice (single shot) and ice_spread (3 bullets in 30° arc)
  - Added fireIceBullet() and fireIceSpread() methods
  - Added player slow effect: slowTimer, slowAmount properties on Player
  - Ice bullets apply slow on hit with visual ice particles
  - Slow effect visual: ice aura with rotating crystal effect around player
  - Ice bullets have glowing visual effect
  - Light blue color (#88ddff), mage type
- **Files Modified**: game.js
- **Test Result**: PASS - Cryomancer spawns, fires ice bullets with slow effect

### Iteration 23: Necromancer enemy
- **Feature**: Summoner enemy that retreats and spawns ghost minions
- **Implementation**:
  - Added NECROMANCER to ENEMIES: 160 hp, 100 debris, 40 speed
  - retreat behavior: moves away from player when close, slow wander otherwise
  - Ring attack (8 bullets) and summon_ghost attack (spawns up to 3 ghosts)
  - Added retreatFromPlayer() method for retreat behavior
  - Added summonGhost() method with spawn particles and test harness logging
  - Purple color (#8844aa), undead type
- **Files Modified**: game.js
- **Test Result**: PASS - Necromancer spawns, retreats from player, summons ghosts

### Iteration 24: Revolver weapon
- **Feature**: 6-shot clip weapon with reload mechanic
- **Implementation**:
  - Added REVOLVER to WEAPONS: 80 damage, 6 clipSize, 1200ms reloadTime
  - Added clip system to Player: clipAmmo, maxClip, reloadTimer, isReloading
  - Modified firePlayerWeapon() to use clip ammo and trigger reload when empty
  - Added startReload() and finishReload() functions
  - Added R key for manual reload
  - Modified speed getter to be compatible with slow system
  - UI shows clip indicator and reload progress bar
  - Orange color (#ffaa44)
- **Files Modified**: game.js
- **Test Result**: PASS - Revolver fires from clip, auto-reloads when empty, manual reload works

### Iteration 25: UI polish with smooth transitions
- **Feature**: Smooth health/shield/ammo bar transitions and visual feedback
- **Implementation**:
  - Added displayHP, displayShields, displayAmmo to Player for smooth interpolation
  - Health bars smoothly drain/fill with lerp-based animation
  - Added hpFlashTimer for white flash effect when damaged
  - Added ammoRefillTimer for white flash when ammo collected
  - Low HP warning pulse effect (red pulsing when HP <= 1)
  - Draining health indicator shows red ghost of lost health
  - Smooth ammo bar with refill indicator
- **Files Modified**: game.js
- **Test Result**: PASS - Smooth transitions work, damage flash triggers correctly

### Iteration 26: Jelly enemy (spawns from Blob)
- **Feature**: Small enemy that spawns when Blob dies, splits into Mini Jellies
- **Implementation**:
  - Added JELLY to ENEMIES: 30 hp, chase behavior, 12 size, lime green (#66ff66)
  - Added MINI_JELLY to ENEMIES: 15 hp, chase behavior, 8 size, lighter green
  - Added splitInto property to Enemy class for configurable split targets
  - Updated BLOB to spawn JELLY instead of SWARMER
  - JELLY splits into 2 MINI_JELLY on death
  - Split enemies get initial velocity away from death point
- **Files Modified**: game.js
- **Test Result**: PASS - Blob splits into 3 Jellies, Jelly splits into 2 Mini Jellies

### Iteration 27: Pulsar weapon
- **Feature**: Extremely rapid fire weapon with limited range
- **Implementation**:
  - Added PULSAR to WEAPONS: 3 damage, 25ms fire rate (40 shots/sec), 1500 ammo
  - 200px max range before bullets dissipate
  - Added maxRange and distanceTraveled to bullets
  - Added slight spread for more chaotic fire pattern
  - Bullets create dissipate particle effect at max range
  - Magenta color (#ff44ff)
- **Files Modified**: game.js
- **Test Result**: PASS - Rapid fire with limited range, bullets dissipate correctly

### Iteration 28: Hermit enemy
- **Feature**: Cowardly enemy that spawns ghosts while avoiding the player
- **Implementation**:
  - Added HERMIT to ENEMIES: 80 hp, 60 debris, 90 speed
  - flee behavior: always runs away from player, faster when closer
  - summon_ghost attack: spawns up to 4 ghosts, 3500ms cooldown
  - Added fleeFromPlayer() method with jitter for unpredictable movement
  - Slows down when reaching corners for safety
  - Blue-gray color (#5566aa), undead type
- **Files Modified**: game.js
- **Test Result**: PASS - Hermit spawns, flees from player, summons ghosts

### Iteration 29: Spear weapon with DoT
- **Feature**: Weapon that deals damage over time (DoT) to enemies
- **Implementation**:
  - Added SPEAR to WEAPONS: 25 initial damage, 15 DoT per tick, 4 ticks over 2 seconds
  - Added dotEffects array to Enemy class for tracking active DoTs
  - Added applyDoT(), updateDoT(), hasDoT() methods to Enemy class
  - DoT tick creates green damage numbers and particles
  - Visual green pulsing ring on enemies with active DoT
  - Modified createDamageNumber() to support custom colors
  - Green color (#88ff44)
- **Files Modified**: game.js
- **Test Result**: PASS - Spear fires, applies DoT, deals 85 total damage (25+60)

### Iteration 30: Razor weapon with wall bounce
- **Feature**: Weapon that bounces off walls multiple times
- **Implementation**:
  - Added RAZOR to WEAPONS: 40 damage, 3 bounces, 80% damage retained per bounce
  - Added isRazor, bouncesRemaining, bounceDamageDecay to bullet properties
  - Wall bounce logic in updateProjectiles() for Razor bullets
  - Orange particle effect on each bounce
  - Bullets removed when bouncesRemaining reaches 0
  - Orange color (#ff8844)
- **Files Modified**: game.js
- **Test Result**: PASS - Razor bullets bounce off walls correctly

### Iteration 31: Giant Ghost with orbiting minions
- **Feature**: Large ghost enemy with protective orbiting mini-ghosts
- **Implementation**:
  - Added GIANT_GHOST to ENEMIES: 250 hp, 150 debris, size 32
  - Added slow_chase behavior (half speed chase)
  - Orbiting minion system: orbitMinions array, orbitAngle, orbitRadius
  - Mini-ghosts rotate around main enemy (20 HP each)
  - Bullets hit orbiting minions first (protective shield)
  - On death, remaining minions release as regular ghosts
  - Added getOrbitMinionPosition(), damageOrbitMinion(), aliveOrbitMinions()
  - Light green color (#aaffaa)
- **Files Modified**: game.js
- **Test Result**: PASS - Giant Ghost spawns with 4 minions, releases ghosts on death

### Iteration 32: Thunderhead weapon with electric field
- **Feature**: Weapon that creates lingering electric damage zones
- **Implementation**:
  - Added THUNDERHEAD to WEAPONS: 8 damage/tick, 40px radius, 2s duration
  - Added electricFields array for tracking active fields
  - createElectricField() and updateElectricFields() functions
  - Fields damage all enemies within radius every 200ms
  - Electric spark particles when damaging enemies
  - drawElectricFields() with pulsing ring, gradient glow, rotating sparks
  - Cyan color (#44ffff)
- **Files Modified**: game.js
- **Test Result**: PASS - Thunderhead creates field, deals 80 total damage over time

### Iteration 33: Runic weapon with orbiting homing runes
- **Feature**: Unique weapon that spawns runes orbiting the player which auto-launch at enemies
- **Implementation**:
  - Added RUNIC to WEAPONS: 35 damage, 12 max orbit runes, 60px orbit radius
  - Added orbitRunes array for tracking active runes
  - Two states: 'orbiting' (circle player) and 'launched' (home toward enemy)
  - updateOrbitRunes() handles: orbit motion, target detection, homing movement
  - Runes auto-launch when enemies within 200px
  - Homing with strength value for gradual turn toward target
  - drawOrbitRunes() with diamond shape, glowing aura
  - Collision detection removes rune on hit
  - Exposed orbitRunes to window for test harness
  - Purple color (#aa44ff)
- **Files Modified**: game.js
- **Test Result**: PASS - Runes orbit player, fire multiple times to build orbit

### Iteration 34: Grinder boss with charge attacks and saws
- **Feature**: Aggressive boss that charges at player and spawns bouncing sawblades
- **Implementation**:
  - Added GRINDER to BOSSES: 1800 hp, 600 debris, speed 100, size 60
  - Two phases: phase 1 (charge + 4 saws), phase 2 (faster charge + 6 saws + ring attack)
  - Added spawn_saw attack type with maxSaws, sawSpeed, sawDamage parameters
  - Added saws array for tracking active sawblade hazards
  - spawnSaw() method spawns saw at random position around boss
  - updateSaws() handles: movement, rotation, wall bouncing, player collision, lifetime
  - spawnSawBounceParticles() creates particle effect on bounce
  - drawSaws() renders rotating sawblade with teeth and glow
  - Saws deal damage to player on contact
  - Fixed boss phase attack timer initialization bug
  - Fixed array reference issue in enterRoom (use .length = 0)
  - Exposed saws to window for test harness
  - Orange color (#ff6633)
- **Files Modified**: game.js
- **Test Result**: PASS - Grinder spawns, charges, creates bouncing saws

### Iteration 35: Ringleader boss with rotating ring
- **Feature**: Necromancer boss with protective rotating bullet ring and ghost summoning
- **Implementation**:
  - Added RINGLEADER to BOSSES: 1600 hp, 550 debris, speed 50, size 52
  - hasRotatingRing: true with ringRadius 80, ringBulletCount 12, ringRotationSpeed 1.5
  - Phase 1: summons 4 ghosts, spread attack, wander movement
  - Phase 2: summons 6 ghosts, ring attack, spiral attack, slow chase
  - Added Enemy properties: hasRotatingRing, ringRadius, ringBulletCount, ringRotationSpeed, ringAngle
  - Ring rotation in Enemy.update() with player collision detection
  - Ring bullets drawn with glow, core, and center in Enemy.draw()
  - Dashed ring orbit path visual
  - Purple color (#9944cc)
- **Files Modified**: game.js
- **Test Result**: PASS - Ringleader spawns with rotating ring, summons ghosts

### Iteration 36: Drill weapon (held weapon, drags enemies)
- **Feature**: Continuous beam weapon that drags enemies towards player
- **Implementation**:
  - Added DRILL to WEAPONS: 5 dps, 200 ammo, 60px length, 16px width
  - isDrill flag for weapon type detection
  - ammoPerSecond: 30 (drains ammo continuously)
  - dragStrength: 120 (pulls enemies at this speed)
  - Added Player properties: isDrilling, drillAngle, drillTickTimer
  - updateDrill() function: ammo consumption, enemy collision, damage ticks, enemy dragging
  - lineCircleIntersect() helper for beam collision detection
  - drawDrill() function: gradient beam, spinning tip effect, particles
  - Drill aims toward mouse position
  - Gray color (#888888)
- **Files Modified**: game.js
- **Test Result**: PASS - Drill weapon consumes ammo, deals continuous damage

### Iteration 37: Weapon keyword system
- **Feature**: Modular keyword system to enhance weapons with special effects
- **Implementation**:
  - Added WEAPON_KEYWORDS constant with 8 keyword modifiers
  - HOMING: bullets track enemies (homingStrength: 3)
  - TRIPLE: fire 3 bullets in 15° spread
  - HIGH_CALIBER: +50% damage, -25% fire rate
  - RAPID: +50% fire rate, -20% damage
  - PIERCING: bullets pierce enemies
  - EXPLOSIVE: bullets explode on hit (40px radius, 50% splash)
  - GIANT: +100% bullet size
  - VAMPIRIC: 15% chance to heal on kill
  - applyWeaponKeyword() function to stack keywords on weapons
  - Modified firePlayerWeapon() to support triple shot and keyword properties
  - Homing behavior in updateBullets() with angle tracking
  - Explosive damage in checkCollisions() with splash particles
  - Vampiric healing in checkCollisions() with heal particles
  - Debug commands: addKeyword(), listKeywords()
  - Keywords stack and modify weapon name (e.g., "High-Caliber Triple Vulcan")
- **Files Modified**: game.js
- **Test Result**: PASS - Keywords apply correctly, stack, and modify weapon stats

### Iteration 38: Enhanced minimap with TAB toggle
- **Feature**: Improved minimap display with room connections and legend
- **Implementation**:
  - Enhanced drawMap() with titled panel border
  - Added room connection lines showing doors between visited rooms
  - Added pulsing current room indicator
  - Added legend showing Start/Boss/Clear/Unknown room types
  - Exposed window.isMapVisible() and window.toggleMap() for testing
  - Added debug commands: toggleMap(), showFullMap()
  - showFullMap() reveals all rooms for testing
  - TAB key toggles minimap on/off
- **Files Modified**: game.js
- **Test Result**: PASS - Map toggles correctly with TAB key and debug commands

### Iteration 39: Full floor map view on room clear
- **Feature**: Large centered floor map display when a room is cleared
- **Implementation**:
  - Added showFullFloorMap and fullMapTimer state variables
  - Full map displays for 3 seconds after room clear
  - Created drawFullFloorMap() with full-screen overlay
  - Larger 40px cell size for better visibility
  - Room connection lines between all rooms
  - Room type icons (S=Start, B=Boss, M=Mini, $=Shop, U=Upgrade, ✓=Cleared)
  - Current room glows with white border
  - Comprehensive legend at bottom
  - Countdown timer shows auto-hide time
  - Fade in/out animation (0.5s each)
  - Added triggerFullFloorMap() debug command
  - Exposed window.isFullMapVisible() and window.getFullMapTimer()
- **Files Modified**: game.js
- **Test Result**: PASS - Full map displays on room clear and via debug command

### Iteration 40: Shop system with item purchasing
- **Feature**: Complete shop system with purchasable items and upgrades
- **Implementation**:
  - Added SHOP_ITEMS constant with 8 items:
    - Consumables: Health Pack, Shield Cell, Bomb, Ammo Pack
    - Upgrades: HP Container, Shield Upgrade, Power Cell, Thruster Mod
  - Each item has name, description, price, color, icon, effect, canBuy
  - generateShopInventory() creates random 3-4 item inventory per shop
  - purchaseShopItem() handles debris deduction and effect application
  - drawShop() displays shop UI with item list, selection, prices
  - Shop navigation: W/S or arrows to select, E/Enter to purchase
  - Items show affordability and availability status
  - Purchased items marked as [SOLD]
  - Shop inventory persists when revisiting rooms
  - Debug commands: enterShop(), getShopInventory(), selectShopItem(), buyShopItem()
- **Files Modified**: game.js
- **Test Result**: PASS - Shop displays, navigation works, purchases succeed

### Iteration 41: Upgrade terminal with upgrade choices
- **Feature**: Roguelike "pick one of three" upgrade system
- **Implementation**:
  - Added UPGRADES constant with 12 unique upgrades:
    - Combat: Damage Boost, Rapid Fire, Critical Strike
    - Defense: Armor Plating, Regeneration, Shield Battery
    - Mobility: Thruster Upgrade, Dash Mastery
    - Resource: Debris Magnet, Ammo Efficiency, Bomb Mastery
    - Special: Floor Scanner
  - generateUpgradeChoices() picks 3 random upgrades
  - selectUpgrade() applies effect and marks terminal as used
  - drawUpgradeTerminal() displays 3 choices side-by-side
  - A/D navigation, E/Enter to confirm
  - Terminal shows "depleted" state after selection
  - Upgrades tracked in player.acquiredUpgrades array
  - Debug commands: enterUpgradeRoom(), selectUpgradeChoice(), confirmUpgrade()
- **Files Modified**: game.js
- **Test Result**: PASS - Terminal displays, selection works, upgrades apply correctly

### Iteration 42: Shrine rooms with trades
- **Feature**: Special rooms offering resource/stat trades
- **Implementation**:
  - Added SHRINES constant with 6 shrine types:
    - Blood Shrine: 1 HP for +25% damage
    - Wealth Shrine: 100 debris for 2 HP heal
    - Guardian Shrine: -10% speed for +2 shields
    - Chaos Shrine: 1 bomb for random effect
    - Speed Shrine: 1 HP for +30% speed
    - Ammo Shrine: 1 shield for +50 max ammo
  - generateShrine() picks random shrine per room
  - canUseShrine() checks if player has required resources
  - useShrine() applies cost and reward
  - drawShrine() displays shrine UI with icon, cost, reward
  - E key to accept trade
  - Shrine depletes after one use
  - Added shrine to map display (purple, † icon)
  - Debug commands: enterShrineRoom(), useShrineDebug()
- **Files Modified**: game.js
- **Test Result**: PASS - Shrines display, trades work correctly, single-use enforced

### Iteration 43: Secret rooms (bomb to reveal)
- **Feature**: Hidden rooms revealed by using bombs near cracked walls
- **Implementation**:
  - Added secretWalls and revealedSecretWalls state arrays
  - checkSecretWalls() detects walls player is near where no room exists
  - revealSecretRoom(direction) creates secret room with loot and doors
  - generateSecretRoomLoot() creates 3-5 valuable pickups (health, shield, bomb, debris)
  - drawCrackedWalls() shows animated crack pattern on walls with potential secrets
  - Modified useBomb() to check for and reveal secret walls
  - Added 'secret' room type to map displays (green, ? icon)
  - Secret rooms are pre-cleared with valuable loot
  - Window exports: checkSecretWalls, revealSecretRoom, getSecretRooms
  - Debug commands: checkSecretWalls(), revealSecretWall(), revealAnySecretWall(), enterSecretRoom(), createSecretRoom()
- **Files Modified**: game.js
- **Test Result**: PASS - Secret walls detected, bomb reveals room, loot spawns correctly

### Iteration 44: Floor progression to floor 2 (Archives theme)
- **Feature**: Multi-floor system with unique visual themes per floor
- **Implementation**:
  - Added FLOOR_THEMES constant with 3 floor themes:
    - Floor 1: Catacombs (blue tones)
    - Floor 2: Archives (green tones)
    - Floor 3: Maintenance (red tones)
  - Each theme has: background, floor, wall, grid, accent, ambientParticles colors
  - getFloorTheme() returns current floor's theme
  - Modified drawRoom() and draw() to use floor theme colors
  - Added floorExitPortal system (spawns after boss defeat)
  - drawFloorExitPortal() renders animated portal with glow effects
  - updateFloorExitPortal() handles portal collision to advance floor
  - advanceToNextFloor() transitions to next floor, generates new map
  - Window exports: FLOOR_THEMES, getFloorTheme, advanceToNextFloor, getFloorExitPortal
  - Debug commands: advanceFloor(), spawnExitPortal(), getFloorInfo(), setFloor()
- **Files Modified**: game.js
- **Test Result**: PASS - Floor themes load correctly, portal spawns and advances floors

### Iteration 45: Difficulty selection
- **Feature**: Multiple difficulty levels affecting combat balance
- **Implementation**:
  - Added DIFFICULTY_SETTINGS constant with 4 difficulty levels:
    - Mild: 0.7x enemy HP, 0.5x enemy damage, 1.2x player damage
    - Normal: 1.0x all multipliers (default)
    - Intense: 1.3x enemy HP, 1.5x enemy damage, 0.9x player damage
    - Sudden Death: 999x enemy damage (one-hit death), 1.5x player damage
  - getDifficulty() returns current difficulty settings
  - Applied difficulty to Enemy constructor (HP, debris)
  - Applied difficulty to playerTakeDamage (enemy damage)
  - Applied difficulty to Player.totalDamageMultiplier (player damage)
  - Added HTML difficulty selector buttons in start screen
  - Added CSS styles for difficulty buttons with color coding
  - Fixed bug: player.takeDamage -> playerTakeDamage
  - Window exports: DIFFICULTY_SETTINGS, getDifficulty, getSelectedDifficulty, setDifficulty
  - Debug commands: setDifficulty(), getDifficultyInfo()
- **Files Modified**: game.js, index.html
- **Test Result**: PASS - All difficulty settings work, HP/damage scales correctly

### Iteration 46: Ship selection system
- **Feature**: 7 unique ships with different stats and passives
- **Implementation**:
  - Added SHIPS constant with 7 ship types:
    - Standard: Balanced stats, no passive
    - Tank: High HP/shields, slow, ARMOR passive (20% damage reduction)
    - Speedster: Fast, low HP, QUICK_DASH passive (50% faster dash cooldown)
    - Bomber: Extra bombs, EXPLOSIVE passive (faster bomb recharge)
    - Glass Cannon: Low HP, starts with Charge, DAMAGE_BOOST passive (+50% damage)
    - Vampire: LIFESTEAL passive (heal on kill chance)
    - Rogue: Random weapon, SCAVENGER passive (+50% debris)
  - Modified Player class to use ship stats for HP, speed, dash, bombs
  - Applied passives in relevant systems (damage, death, debris)
  - Ship color used for player ship rendering
  - HTML/CSS ship selector buttons in start screen
  - Window exports: SHIPS, getShip, getSelectedShip, setShip
  - Debug commands: setShip(), getShipInfo()
- **Files Modified**: game.js, index.html
- **Test Result**: PASS - All ships apply stats and passives correctly

### Iteration 47: End-of-floor boss reward choice
- **Feature**: Choose HP, Damage, or Shield reward after defeating boss
- **Implementation**:
  - Added BOSS_REWARDS constant with 3 reward types:
    - Vitality: +1 Max HP, Full Heal
    - Power: +15% Damage
    - Protection: +2 Shields
  - Added state: bossRewardChoices, selectedBossReward, bossRewardChosen
  - generateBossRewards() creates list of 3 reward choices
  - selectBossReward(index) applies reward effect and spawns portal
  - drawBossRewardChoice() renders reward selection UI panel
  - Added hexToRgb() and wrapText() helper functions
  - Keyboard navigation: A/D or 1/2/3 to select, E/Enter to confirm
  - Portal spawns after reward is chosen (not immediately after boss)
  - Window exports: BOSS_REWARDS, getBossRewards, getSelectedBossReward, isBossRewardChosen, selectBossReward, generateBossRewards
  - Debug commands: showBossRewards(), getBossRewards(), selectBossRewardIndex(), confirmBossReward(), isBossRewardChosen()
- **Files Modified**: game.js
- **Test Result**: PASS - Reward UI shows, selection works, rewards apply correctly, portal spawns

### Iteration 48: Cartridge/upgrade inventory system
- **Feature**: Collectible passive items that provide ongoing bonuses
- **Implementation**:
  - Added CARTRIDGES constant with 12 cartridge types:
    - Offensive: Hot Shot (burn), Piercing Rounds, Lucky Seven (crit), Overcharge
    - Defensive: Iron Skin (damage ignore), Second Wind (revive), Shield Capacitor, Hardened Hull
    - Utility: Treasure Hunter (debris), Ammo Recycler, Map Chip, Quick Loader
  - Each cartridge has rarity (common/uncommon/rare) affecting spawn weights
  - Added cartridgeInventory array with MAX_CARTRIDGES = 8 limit
  - addCartridge(), hasCartridge(), countCartridge() helper functions
  - getRandomCartridge() weighted selection based on rarity
  - Added 'cartridge' pickup type with special rendering (icon in glowing box)
  - UI display shows collected cartridges in top-right (icons in colored slots)
  - Cartridge inventory resets on game start
  - 50% chance of cartridge drop in secret rooms
  - Window exports: CARTRIDGES, getCartridgeInventory, addCartridge, hasCartridge, countCartridge, getRandomCartridge
  - Debug commands: addCartridge(), listCartridges(), getInventory(), spawnCartridgePickup(), clearCartridges()
- **Files Modified**: game.js
- **Test Result**: PASS - Cartridges add correctly, UI displays, pickups spawn, inventory resets

### Iteration 49: Blessing system
- **Feature**: Elemental weapon enhancements with unique effects
- **Implementation**:
  - Added BLESSINGS constant with 6 blessing types:
    - FLAME: Fire DoT (30% chance, stacking damage over time)
    - FROST: Slow enemies (25% chance, 50% speed reduction for 2s)
    - STORM: Chain lightning (20% chance, chains to 2 nearby enemies)
    - EARTH: Knockback (35% chance, pushes enemies away)
    - VOID: Pierce (40% chance, bullets pass through)
    - HOLY: Heal on crit (10% chance to heal 1 HP)
  - Active blessing state with applyBlessing(), getActiveBlessing(), removeBlessing()
  - applyBlessingEffect() called when enemies take damage
  - updateBlessingEffects() updates DoT, slow timers, knockback
  - Blessing display in bottom UI bar (icon + name, colored by element)
  - Blessing resets on game restart
  - Window exports: BLESSINGS, getActiveBlessing, applyBlessing, removeBlessing
  - Debug commands: applyBlessing(), listBlessings(), getBlessing(), removeBlessing()
- **Files Modified**: game.js
- **Test Result**: PASS - Blessings apply correctly, effects trigger, UI displays, reset works

### Iteration 50: Player movement and dash balance tuning
- **Feature**: Improved player movement responsiveness with velocity-based control
- **Implementation**:
  - Added velocity-based movement system:
    - Acceleration rate: 2500 pixels/sec² (fast ramp-up)
    - Deceleration rate: 3000 pixels/sec² (snappy stops)
    - Higher decel when changing direction for responsive control
  - Added moveTowards() utility function for smooth interpolation
  - Player now has vx/vy velocity properties
  - Diagonal movement properly normalized to prevent speed boost
  - Movement feels snappier with quick stops and direction changes
  - Dash mechanics retained with original timing
- **Files Modified**: game.js
- **Test Result**: PASS - Velocity builds up, decelerates on release, diagonal normalized
