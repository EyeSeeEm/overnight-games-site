# Player Intent Map: Binding of Isaac Clone

## Game Type
Top-down roguelike dungeon crawler with twin-stick shooter mechanics. Procedurally generated room-based exploration with permadeath and item synergies.

## Win Condition
Defeat the final boss at the end of the dungeon (6+ floors). Alternative: survive as long as possible, collecting items and clearing floors.

## Core Loop
1. Enter room
2. Enemies spawn with wake-up animation (0.5s delay before attacking)
3. Clear all enemies using tears (projectiles)
4. Doors unlock, pickup may spawn
5. Choose which door to take (explore or progress)
6. Find treasure room, shop, and boss room
7. Defeat floor boss, collect item, descend trapdoor
8. Repeat until death or victory

---

## Player Intents by State

### Title Screen
**Player wants:** Start a new run quickly
**Actions:** Press Start/Enter, possibly select character
**Success:** Game loads fast, controls are clear, can begin within 2-3 seconds
**Frustration if:** Long loading, confusing menus, unclear how to start

### Room Entry
**Player wants:** Get oriented, see what they're dealing with
**Actions:** Scan room for enemies, obstacles, doors, pickups
**Success:** Clear visual hierarchy - enemies obvious, obstacles visible, doors marked
**Frustration if:** Enemies attack instantly (no wake-up delay), player spawns in obstacle, can't see enemies clearly, spawns too far from door edge

### Combat
**Player wants:** Kill all enemies without taking damage
**Actions:** Move with WASD, fire tears with Arrow Keys, dodge enemy attacks, use terrain
**Success:** Responsive controls, clear enemy patterns, satisfying hit feedback, tears feel good to fire
**Frustration if:** Controls unresponsive, enemies attack through walls, unclear hitboxes, tears feel weak, no hit confirmation, game crashes when killing enemies

### Room Cleared
**Player wants:** Collect rewards, decide next move
**Actions:** Pick up drops (hearts, coins, keys, bombs), check minimap, choose door
**Success:** Doors unlock immediately, clear audio/visual feedback, minimap shows room connections
**Frustration if:** Doors don't open, can't tell which rooms visited, pickups hard to see

### Item Pedestal (Treasure Room)
**Player wants:** Understand item before taking, get powered up
**Actions:** Approach pedestal, read tooltip, take item
**Success:** Tooltip shows from good distance (80px+), clear description, visible stat changes, item has unique visual
**Frustration if:** Can't read item effect, tooltip too small or too close, generic item icons, no visual change after pickup

### Shop Room
**Player wants:** Spend coins wisely on useful items
**Actions:** Browse items, check prices, buy what's affordable and useful
**Success:** Clear prices, can see what items do before buying, enough variety
**Frustration if:** Items too expensive, can't tell what items do, shop empty or boring

### Boss Encounter
**Player wants:** Defeat boss, get loot, progress
**Actions:** Learn boss patterns, dodge attacks, deal damage, survive
**Success:** Boss has clear tells, attacks are readable, health bar visible, satisfying defeat animation
**Frustration if:** Unfair attacks (no tells), instant death, boss gets stuck, no indication of damage dealt

### Taking Damage
**Player wants:** Understand what hit them, recover
**Actions:** Note damage source, use i-frames to escape, find healing
**Success:** Clear damage feedback, screen shake/flash, i-frames work (1 second), player flashes during invincibility
**Frustration if:** Don't know what hit them, multiple hits in rapid succession (no i-frames), no recovery time

### Death
**Player wants:** Understand why they died, try again quickly
**Actions:** See death screen, possibly view run stats, restart
**Success:** Quick death animation, clear "you died" message, fast restart option
**Frustration if:** Long death animation, forced to watch stats, slow restart, unclear what killed them

### Victory (Boss Defeated)
**Player wants:** Celebrate, collect rewards, progress
**Actions:** Collect boss item from pedestal, grab hearts, enter trapdoor
**Success:** Item pedestal spawns, hearts spawn, trapdoor opens, clear next-floor transition
**Frustration if:** Rewards don't spawn, trapdoor missing, unclear how to proceed

---

## Game-Specific Intents

### Minimap Navigation
**Player wants:** Know where they are, find unexplored rooms
**Actions:** Glance at minimap (top-right), hold Tab for full map, plan route
**Success:** Fog of war (only show discovered rooms), special rooms marked (yellow=treasure, red=boss, cyan=shop), current room highlighted
**Frustration if:** All rooms visible from start (no exploration mystery), can't tell room types, minimap too small

### Key/Bomb Resource Management
**Player wants:** Use keys for treasure rooms, bombs for secrets
**Actions:** Count resources, prioritize locked doors, bomb suspicious walls
**Success:** Clear resource count visible, locked doors obvious, secret room hints
**Frustration if:** Can't see resource count, accidentally waste key/bomb, no indication of secret room locations

### Devil/Angel Room Decision
**Player wants:** Weigh risk vs reward of devil deals
**Actions:** Check health, evaluate items offered, decide to take or leave
**Success:** Clear costs shown, can preview item effects, understand consequences
**Frustration if:** Costs unclear, can't tell what items do, accidentally take item

### Item Synergy Discovery
**Player wants:** Build powerful combos
**Actions:** Collect multiple items, experiment with effects
**Success:** Visual feedback when synergies activate, items actually combine, noticeable power increase
**Frustration if:** Items don't synergize, can't tell if combo working, effects invisible

### Obstacle Destruction
**Player wants:** Clear path, find hidden rewards
**Actions:** Shoot poops (tears), bomb rocks, explore tinted rocks
**Success:** Poops destroyable with tears (show damage states), rocks breakable with bombs, tinted rocks have distinct look
**Frustration if:** Can't destroy poops, bombs don't break rocks, player gets stuck on obstacles

### Sacrifice/Curse Rooms
**Player wants:** Risk health for potential rewards
**Actions:** Intentionally take damage on spikes (sacrifice), enter/exit curse room (takes damage)
**Success:** Clear damage indication, meaningful rewards possible, room visually distinct
**Frustration if:** Damage unclear, rewards too rare, can't tell room type from door

### Room Transitions
**Player wants:** Smooth, reliable transitions between rooms
**Actions:** Walk through door opening
**Success:** Brief pause on entry (100ms), player spawns at door edge, enemies don't attack immediately
**Frustration if:** Game crashes during transition, player stuck in geometry, enemies attack instantly, room state not persisted (killed enemies respawn)

---

## Testing Implications

| State | Must Test | Debug Setup |
|-------|-----------|-------------|
| Title Screen | Start button works | Verify scene loads, controls respond |
| Room Entry | Player spawns near door edge, not in obstacles | Spawn at all 4 door directions, check collision |
| Combat | All enemy types killable without crash | Kill each enemy type 10+ times |
| Room Cleared | Doors unlock, pickups spawn | Clear room, verify door state changes |
| Item Pedestal | Tooltip visible from 80px, item unique sprite | Approach item from all directions |
| Shop | Items purchasable, prices correct | Buy with exact coins, insufficient coins |
| Boss | All attacks dodgeable, health bar visible | Fight each boss, verify no unfair attacks |
| Taking Damage | i-frames work (1 second), player flashes | Take multiple hits rapidly, verify single damage |
| Death | Quick restart available | Die, verify restart works |
| Victory | Item spawns, trapdoor opens | Kill boss, verify rewards |
| Minimap | Fog of war, room colors correct | Explore floor, verify discovery system |
| Resources | Count visible, accurate | Use keys/bombs, verify count decrements |
| Devil Room | Costs clear, trade works | Take devil deal, verify health loss |
| Synergies | Combos work | Collect synergy items, verify effect |
| Destruction | Poops destroyable, visual damage states | Shoot poops, bomb rocks |
| Room Transitions | No crashes, state persists | Enter/exit rooms 50+ times, verify killed enemies stay dead |
| Controls | WASD move, Arrow keys fire | Hold movement during room transition, verify pause then continue |

---

## Critical Bugs to Test For (From Feedback)

| Bug Type | Test Method | Expected Result |
|----------|-------------|-----------------|
| Enemy kill crash | Kill every enemy type 10+ times | No crashes |
| Room transition crash | Transition 50+ times | No crashes, no hangs |
| Room state loss | Kill enemies, leave room, return | Enemies stay dead |
| Movement bleed | Hold direction through door | Brief pause, then continue |
| Collision stuck | Enter room from all doors | Player never stuck in objects |
| Poop indestructible | Shoot poop | Shows damage, eventually breaks |
| Damage numbers | Attack enemy | NO floating damage numbers |
| Wrong controls | Check keyboard input | WASD=move, Arrows=fire (not IJKL) |

---

## Grid Alignment Tests

| Element | Test | Expected |
|---------|------|----------|
| Rocks | Place on grid | Center of tile, fills tile visually |
| Poops | Place on grid | Center of tile, fills tile visually |
| Enemies | Spawn on grid | Spawn point grid-aligned |
| Player | Spawn position | Near door edge, grid-aware |
| Pickups | Drop position | Grid or near-grid position |

Room is 13x7 tiles. All static objects must snap to grid (no floating point positions between tiles).

---

## Special Room Requirements

| Room Type | Minimap Color | Must Have | Test |
|-----------|---------------|-----------|------|
| Treasure | Yellow | 1 item pedestal | Verify yellow on map, pedestal exists |
| Shop | Cyan | 2-4 purchasable items | Verify cyan on map, items have prices |
| Boss | Red | Boss enemy, item drop | Verify red on map, boss spawns |
| Sacrifice | Brown | Spikes in center | Verify spikes damage player |
| Curse | Brown (spiked door) | Damage on entry/exit | Verify door visual, damage taken |
| Secret | Hidden | Good pickups | Verify bombable wall works |
| Normal | Brown | Enemies and/or obstacles | Verify doors lock until clear |

**Every floor MUST have:** Start room, Treasure room (yellow), Shop (mandatory), Boss room (red)

---

*Generated from GDD: C:\Dev\overnight-games\gdds-v2\binding-of-isaac-clone.md*
*Document version based on 2026-01-11 feedback iteration*
