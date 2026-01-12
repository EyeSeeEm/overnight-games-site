# Iterations: pirateers-v2 (phaser)

## Iteration 1
- What: Created project structure and index.html
- Why: GDD requires Phaser 3 naval adventure game
- Result: Basic HTML wrapper with Phaser CDN link

## Iteration 2
- What: Created BootScene with programmatic texture generation
- Why: GDD specifies no external assets, procedural graphics
- Result: Ship textures (player, merchant, navy, pirate) and projectiles

## Iteration 3
- What: Created TitleScene with ship selection
- Why: GDD requires 3 ship types: balanced, fast, heavy
- Result: Interactive ship selection with stats display

## Iteration 4
- What: Created BaseScene port/shop system
- Why: GDD requires day/night structure with port phase
- Result: Shipyard, weapons, market, quests UI panels

## Iteration 5
- What: Implemented shipyard upgrade system
- Why: GDD requires armor, speed, reload, firepower upgrades
- Result: 10-level upgrade system with costs

## Iteration 6
- What: Added weapons shop and cargo trading
- Why: GDD requires weapons and market mechanics
- Result: 4 weapon types, sell all cargo functionality

## Iteration 7
- What: Created SailingScene with world and islands
- Why: GDD requires open world sailing with 6 islands
- Result: 2400x2400 world with 6 named islands

## Iteration 8
- What: Implemented player ship controls
- Why: GDD requires W/S speed levels, A/D turning
- Result: 4 speed levels, fast turning, broadside fire

## Iteration 9
- What: Added enemy ships with AI
- Why: GDD requires merchant, navy, pirate enemies
- Result: 5 enemy types with patrol/attack/flee states

## Iteration 10
- What: Implemented combat and loot systems
- Why: GDD requires broadside combat, gold, cargo drops
- Result: Cannon fire, gold pickups, cargo collection

## Iteration 11
- What: Added Ghost Ship enemy type
- Why: GDD specifies ghost ship as enemy (175 HP, 110 speed, 30 dmg)
- Result: Ghost Ship added to enemy types with ghostly appearance

## Iteration 12
- What: Added Ghost Ship texture and wake particle
- Why: Visual distinction for ghost ships
- Result: Semi-transparent ghost ship texture, wake effect texture

## Iteration 13
- What: Added minimap to SailingScene
- Why: GDD recommends navigation aids for open world
- Result: 100px minimap showing islands and player position

## Iteration 14
- What: Added minimap update and wake trail
- Why: Dynamic minimap and visual sailing feedback
- Result: Enemy dots on minimap, wake particles behind ship

## Iteration 15
- What: Updated enemy spawn for Ghost Ships
- Why: Ghost ships should appear near Ghost Isle after day 5
- Result: Location-based ghost ship spawning logic

## Iteration 16
- What: Added day/night visual tinting
- Why: GDD mentions day timer, visual feedback helps
- Result: Dynamic background color based on time remaining

## Iteration 17
- What: Added cannon smoke particles
- Why: Visual feedback for firing
- Result: Smoke puffs on cannon fire from both sides

## Iteration 18
- What: Added enemy health bars
- Why: Combat feedback for player
- Result: Health bars above each enemy ship

## Iteration 19
- What: Added health bar update to game loop
- Why: Health bars need to follow enemies
- Result: Real-time health bar positioning and scaling

## Iteration 20
- What: Added health bar cleanup on enemy death
- Why: Prevent orphaned health bars
- Result: Health bars destroyed with enemy

## Iteration 21-25
- What: Added Oil Slick and Battering Ram weapons
- Why: GDD specifies these weapons
- Result: 6 weapons total in shop

## Iteration 26-30
- What: Added Game Over and Victory scenes
- Why: GDD requires proper end states
- Result: Statistics display, rating system, restart option

## Iteration 31-35
- What: Added Treasure Hunting mini-game scene
- Why: GDD specifies treasure hunt with hot/cold feedback
- Result: 3 attempts, distance feedback, rewards

## Iteration 36
- What: Added TreasureScene to config
- Why: Scene needs to be registered
- Result: TreasureScene accessible from sailing

## Iteration 37-40
- What: Added treasure map item and trigger
- Why: Treasure maps should trigger treasure hunt
- Result: Special item type that starts TreasureScene

## Iteration 41-45
- What: Added treasure map collection check
- Why: Need to detect treasure maps in loot
- Result: Automatic scene switch on treasure map pickup

## Iteration 46-55
- What: Added Kraken Boss Fight scene
- Why: GDD specifies Kraken as final boss
- Result: 2-phase boss fight (tentacles then body)

## Iteration 56
- What: Added KrakenScene to config
- Why: Scene needs to be registered
- Result: Kraken fight accessible from quest board

## Iteration 57-60
- What: Added Neptune's Eye Quest and more quests
- Why: GDD specifies quest variety
- Result: 5 quest types plus Kraken final quest

## Iteration 61-65
- What: Added Kraken quest acceptance handler
- Why: Kraken quest should start boss fight
- Result: Direct scene transition to KrakenScene

## Iteration 66-70
- What: Added Neptune's Eye piece drops and floating text
- Why: GDD specifies piece collection from bosses
- Result: Piece drops from certain enemies, floating feedback

## Iteration 71
- What: Added showFloatingText function
- Why: Visual feedback system needed
- Result: Animated floating text for all feedback

## Iteration 72-75
- What: Added quest tracker and Neptune's Eye display
- Why: Player needs to see progress
- Result: HUD shows active quests and piece count

## Iteration 76
- What: Added updateQuestTracker function
- Why: Quest display needs updating
- Result: Dynamic quest progress in HUD

## Iteration 77-80
- What: Added fort definitions
- Why: GDD specifies 3 forts as targets
- Result: Watchtower, Coastal Fort, Naval Fortress

## Iteration 81-85
- What: Added fort creation and combat
- Why: Forts need to be attackable
- Result: Fort sprites, health bars, firing AI

## Iteration 86-88
- What: Added fort update and collision
- Why: Fort combat loop needed
- Result: Bullet-fort collision, fort destruction rewards

## Iteration 89-92
- What: Added forts to minimap
- Why: Navigation aid for fort locations
- Result: Brown squares on minimap for forts

## Iteration 93-96
- What: Added save/load system
- Why: GDD specifies auto-save and continue
- Result: localStorage save/load functions

## Iteration 97-100
- What: Added continue button and auto-save
- Why: Complete save system integration
- Result: Continue from title, auto-save at day end

## Iteration 101-105
- What: Added crew morale system
- Why: GDD specifies crew management and morale affects performance
- Result: Morale levels (high/normal/low/critical) with speed/reload modifiers

## Iteration 106-110
- What: Added reputation system
- Why: GDD mentions faction relations
- Result: Merchants, navy, pirates reputation tracking

## Iteration 111-115
- What: Added weather system constants
- Why: GDD specifies dynamic weather affecting gameplay
- Result: 4 weather types with visibility and speed modifiers

## Iteration 116-120
- What: Added achievement system
- Why: GDD recommends progression milestones
- Result: 7 achievements with unlock conditions and popup notifications

## Iteration 121-125
- What: Added environmental hazards constants
- Why: GDD mentions navigational challenges
- Result: 3 reef locations and 2 whirlpool locations defined

## Iteration 126-130
- What: Added ship condition stat
- Why: GDD specifies ship wear/maintenance
- Result: Condition percentage affecting overall performance

## Iteration 131-135
- What: Created createHazards() function
- Why: Hazards need visual representation
- Result: Reefs with rock details, whirlpools with spiral effect

## Iteration 136-140
- What: Created initializeWeather() function
- Why: Weather needs to be set at day start
- Result: Random weather selection, rain/lightning timer setup

## Iteration 141-145
- What: Added spawnRain() and flashLightning() functions
- Why: Visual feedback for weather effects
- Result: Rain particles during rainy/stormy, lightning flashes with damage

## Iteration 146-150
- What: Added updateHazards() function
- Why: Hazards need collision detection
- Result: Reef damage and slow, whirlpool pull and spin effects

## Iteration 151-155
- What: Integrated hazards and weather into update loop
- Why: Systems need to run every frame
- Result: updateHazards() and checkAchievements() in update()

## Iteration 156-160
- What: Added weather and morale modifiers to handleInput()
- Why: Stats need to affect ship movement
- Result: Speed multiplied by weather, morale, and condition modifiers

## Iteration 161-165
- What: Added weather/morale UI to createUI()
- Why: Player needs visibility of new stats
- Result: Weather text, morale bar, condition display, crew count

## Iteration 166-170
- What: Updated updateUI() with new displays
- Why: UI elements need real-time updates
- Result: Dynamic morale color, condition color, crew text

## Iteration 171-175
- What: Added morale boost on enemy kill
- Why: Victory should reward crew morale
- Result: +3 morale per enemy destroyed

## Iteration 176-180
- What: Added morale/condition decrease on damage
- Why: Taking hits should have consequences
- Result: -1 morale, -0.5 condition per hit

## Iteration 181-185
- What: Added ship repair in shipyard
- Why: Condition needs restoration option
- Result: Repair button with cost (2g per condition %), repairShipCondition()

## Iteration 186-190
- What: Added Tavern button to base scene
- Why: Crew management needs dedicated UI
- Result: New TAVERN button between MARKET and QUESTS

## Iteration 191-195
- What: Created openTavern() function
- Why: Tavern needs menu content
- Result: 4 tavern options with costs and effects

## Iteration 196-198
- What: Added trackDistanceSailed() function
- Why: Statistics need distance tracking
- Result: Distance incremented based on ship velocity

## Iteration 199
- What: Added physics config to game config
- Why: Physics system needs global setup for scenes
- Result: Arcade physics with no debug

## Iteration 200
- What: Exposed game/gameData globally for testing
- Why: Enable automated testing with Playwright
- Result: window.game and window.gameData available

---

## Feedback Fixes (2026-01-11 - Session 2)

### Fix 1: Port Interaction System
**Problem:** No way to enter ports - players couldn't figure out how to dock.

**Solution:**
- Added glowing ring around port docks that pulses when player is near
- Added "Press E to DOCK" text prompt above ports
- Added E key binding for docking
- Implemented checkIslandProximity() with 100-pixel detection range
- Visual feedback: port marker changes color when player is in range

**Files:** game.js (createIslands, checkIslandProximity, input keys)

### Fix 2: Port Menu Implementation
**Problem:** Port menu needed Trade, Repair, Upgrade, Leave options.

**Solution:**
- Created openPortMenu() with full menu UI
- Trade menu shows grouped cargo with sell prices
- Sell individual items or use "SELL ALL" button
- Repair costs 0.5g per HP to restore
- Port prices vary by island type (as defined in GDD)
- Clean close/reopen functionality

**Files:** game.js (openPortMenu, closePortMenu, repairShip, openTradeMenu, sellCargo, sellAllCargo)

### Fix 3: Enemy Cargo Drops
**Problem:** Enemy ships didn't drop cargo when destroyed.

**Solution:**
- Each enemy type now drops 1 to lootSlots cargo items
- Cargo types based on enemy:
  - Merchants: rum, spices, silk (trade goods)
  - Navy: rum, spices, gold_bars (supplies)
  - Pirates: rum, silk, gold_bars (stolen goods)
  - Captains: gold_bars, gems, silk, artifacts (rare)
  - Ghost ships: artifacts, gems, gold_bars (ancient)
- Loot floats with sparkle effect
- Auto-despawn after 15 seconds
- Color-coded by cargo type

**Files:** game.js (destroyEnemy)

### Fix 4: Cargo Collection Feedback
**Problem:** No visual feedback when collecting cargo.

**Solution:**
- Show "+[Item Name]" floating text when cargo collected
- Show "Cargo full!" warning if capacity exceeded
- Handle both old itemType and new cargoType properties

**Files:** game.js (collectLoot)

### Fix 5: HUD Cargo Preview Icons
**Problem:** Cargo, cash, and stats not shown on-screen.

**Solution:**
- Added cargo preview icons row in HUD (below cargo text)
- Icons color-coded by cargo type
- Shows count badge (x2, x3, etc.) for stacked items
- Displays up to 8 cargo types with "..." for more
- Updates in real-time via updateCargoIcons()
- Existing HUD already showed gold, armor, speed

**Files:** game.js (createUI, updateUI, updateCargoIcons, getCargoColor)

### Helper Functions Added:
- `getCargoColor(cargoType)` - Returns color code for cargo type
- `updateCargoIcons()` - Refreshes cargo preview in HUD
- `showPortMessage(msg)` - Displays temporary message during port interaction

**Tested:** Yes - Game loads, islands render, port interaction works
