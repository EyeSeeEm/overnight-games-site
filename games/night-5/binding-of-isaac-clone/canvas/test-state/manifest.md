# Feature Manifest: Binding of Isaac Clone

Generated from GDD on 2026-01-12

---

## Core Mechanics

### Movement
- [ ] **8-directional movement** - WASD keys for all 8 directions
  - Verification: Player moves in all 8 directions smoothly
- [ ] **Instant direction changes** - No acceleration/deceleration
  - Verification: Direction changes are immediate, not gradual
- [ ] **Movement speed stat** - Base 1.0, affects movement rate
  - Verification: Speed items change player velocity

### Shooting
- [ ] **Arrow key firing** - Arrow keys fire tears in 4 cardinal directions
  - Verification: Each arrow key fires in correct direction
- [ ] **Tear spawning** - Tears spawn from player position
  - Verification: Tears appear at player location when firing
- [ ] **Tear physics** - Tears travel with slight arc/gravity
  - Verification: Tears arc downward slightly during flight
- [ ] **Tear range** - Tears disappear after traveling set distance
  - Verification: Tears expire based on range stat
- [ ] **Tear damage** - Tears deal damage based on damage stat
  - Verification: Enemy HP decreases correctly on hit
- [ ] **Fire rate** - Controlled by tears stat (delay between shots)
  - Verification: Higher tears stat = faster firing
- [ ] **Shot speed stat** - Affects tear velocity
  - Verification: Shot speed items change tear travel speed
- [ ] **Player momentum inheritance** - Tears inherit slight player velocity
  - Verification: Moving while shooting curves tears slightly

### Combat
- [ ] **Knockback on enemies** - Tears push enemies on hit
  - Verification: Enemies get pushed back when hit by tears
- [ ] **Contact damage** - Enemies damage player on touch
  - Verification: Touching enemy reduces player health
- [ ] **Invincibility frames** - 1 second i-frames after damage
  - Verification: Player blinks and cannot be hit for 1 second
- [ ] **Player death** - Game over when all hearts depleted
  - Verification: Zero health triggers game over screen

---

## Health System

### Heart Types
- [ ] **Red hearts** - Standard health, can be refilled
  - Verification: Red hearts display, can be healed
- [ ] **Half red hearts** - Heal/damage in half-heart increments
  - Verification: Half hearts display correctly
- [ ] **Soul hearts** - Temporary HP, cannot be refilled, end of bar
  - Verification: Soul hearts appear after red hearts, are consumed first
- [ ] **Black hearts** - Like soul hearts, deal 40 damage to room when lost
  - Verification: Losing black heart damages all enemies
- [ ] **Eternal hearts** - Become container next floor, lost on damage
  - Verification: Survives floor = new container, takes damage = lost
- [ ] **Bone hearts** - Empty container that holds 1 red heart
  - Verification: Can be filled or emptied
- [ ] **Rotten hearts** - Spawn flies when room cleared, 1-hit destroy
  - Verification: Spawns blue flies, destroyed in single hit

### Heart Container Rules
- [ ] **Max 12 heart containers** - Cannot exceed limit
  - Verification: Heart-up items stop working at 12
- [ ] **Max 12 soul/black hearts** - Shared limit with containers
  - Verification: Cannot have more than 24 total HP points
- [ ] **Damage priority** - Soul/black first, then red
  - Verification: Soul hearts deplete before red hearts

---

## Pickup System

### Basic Pickups
- [ ] **Red heart pickup** - Heals 1 full heart (20% drop rate)
  - Verification: Collecting heals 1 heart
- [ ] **Half red heart pickup** - Heals half heart (15% drop rate)
  - Verification: Collecting heals 0.5 hearts
- [ ] **Soul heart pickup** - Adds 1 soul heart (5% drop rate)
  - Verification: Soul heart added to bar
- [ ] **Penny** - +1 coin (25% drop rate)
  - Verification: Coin count increases by 1
- [ ] **Nickel** - +5 coins (3% drop rate)
  - Verification: Coin count increases by 5
- [ ] **Dime** - +10 coins (0.5% drop rate)
  - Verification: Coin count increases by 10
- [ ] **Bomb pickup** - +1 bomb (10% drop rate)
  - Verification: Bomb count increases
- [ ] **Key pickup** - +1 key (10% drop rate)
  - Verification: Key count increases
- [ ] **Golden key** - Infinite keys this floor (very rare)
  - Verification: Key counter shows infinity, doors free
- [ ] **Golden bomb** - Infinite bombs this floor (very rare)
  - Verification: Bomb counter shows infinity

### Consumables
- [ ] **Pills** - Random effect (good or bad)
  - Verification: Using pill triggers random effect
- [ ] **Cards** - Specific effect when used
  - Verification: Card has consistent effect
- [ ] **Runes** - Powerful single-use effects
  - Verification: Rune triggers powerful effect
- [ ] **Trinkets** - Passive effect while held (1 slot)
  - Verification: Trinket provides passive bonus

### Pickup Mechanics
- [ ] **Luck affects drop rates** - Higher luck = more drops
  - Verification: Luck stat increases drop frequency
- [ ] **Pickups spawn from enemies** - On enemy death
  - Verification: Killing enemy can drop pickup
- [ ] **Pickups spawn on room clear** - Reward for clearing
  - Verification: Last enemy death can spawn pickup

---

## Item System

### Item Types
- [ ] **Passive items** - Permanent stat/effect modifications
  - Verification: Picking up passive item changes stats permanently
- [ ] **Active items** - One slot, require charges, spacebar to use
  - Verification: Active item has cooldown, spacebar activates
- [ ] **Active item charges** - Filled by clearing rooms
  - Verification: Clearing room adds charge
- [ ] **Active item replacement** - New active replaces old
  - Verification: Picking up active drops current one

### Item Pedestals
- [ ] **Item pedestal display** - Items shown on pedestals
  - Verification: Items float on pedestal, visually distinct
- [ ] **Item tooltips** - Show name/description on approach
  - Verification: Walking near item shows tooltip (80px radius)
- [ ] **Unique item visuals** - Each item has distinct sprite
  - Verification: Items are visually recognizable

### Item Effects
- [ ] **Stat modifier items** - Change damage/tears/range/speed/luck
  - Verification: Collecting item changes stat display
- [ ] **Homing tears** - Tears track enemies (Spoon Bender)
  - Verification: Tears curve toward enemies
- [ ] **Piercing tears** - Tears pass through enemies (Cupid's Arrow)
  - Verification: Tears hit multiple enemies
- [ ] **Spectral tears** - Tears pass through obstacles
  - Verification: Tears ignore rocks/obstacles
- [ ] **Explosive tears** - Tears explode on hit (Ipecac)
  - Verification: Tear impact creates explosion
- [ ] **Bouncing tears** - Tears bounce off walls (Rubber Cement)
  - Verification: Tears reflect off walls
- [ ] **Split tears** - Tears split on hit (Parasite/Cricket's Body)
  - Verification: Hitting enemy spawns more tears
- [ ] **Triple shot** - Fire 3 tears (Inner Eye)
  - Verification: Single fire = 3 tears
- [ ] **Brimstone** - Charge blood laser replaces tears
  - Verification: Hold fire = charge, release = laser
- [ ] **Technology** - Laser replaces tears
  - Verification: Firing shoots laser beam
- [ ] **Mom's Knife** - Throwing knife replaces tears
  - Verification: Knife projectile instead of tears

### Item Pools
- [ ] **Treasure room pool** - 50+ items minimum
  - Verification: Treasure rooms draw from this pool
- [ ] **Boss pool** - 20+ items minimum
  - Verification: Boss drops draw from this pool
- [ ] **Shop pool** - 30+ items minimum
  - Verification: Shop items draw from this pool
- [ ] **Devil room pool** - 15+ items minimum
  - Verification: Devil room items draw from this pool
- [ ] **Angel room pool** - 10+ items minimum
  - Verification: Angel room items draw from this pool
- [ ] **Pool depletion** - Seen items removed from pool
  - Verification: Same item doesn't appear twice in run

### Transformations
- [ ] **Guppy transformation** - 3 Guppy items = flight + fly spawning
  - Verification: 3 cat items triggers transformation
- [ ] **Beelzebub transformation** - 3 fly items = flight + flies
  - Verification: 3 fly items triggers transformation
- [ ] **Spun transformation** - 3 syringe items = +2 damage, +0.15 speed
  - Verification: 3 syringe items triggers stat boost
- [ ] **Seraphim transformation** - 3 angel items = flight + 3 soul hearts
  - Verification: 3 angel items triggers transformation

---

## Room System

### Room Grid
- [ ] **13x7 tile grid** - All rooms use this exact grid
  - Verification: Rooms display as 13 columns x 7 rows
- [ ] **Grid-snapped objects** - All objects align to tile grid
  - Verification: Rocks/poop/enemies on exact tile centers
- [ ] **Objects fill grid squares** - Visual size matches tile
  - Verification: Objects don't float between tiles
- [ ] **Room fills screen** - One room = one screen, no scrolling
  - Verification: Camera fixed per room

### Room Contents
- [ ] **Rocks** - Block movement, destructible by bombs
  - Verification: Cannot walk through, bomb destroys
- [ ] **Poop** - Block movement, destructible by tears/bombs, shows damage states
  - Verification: Takes multiple hits, visual cracking, can destroy
- [ ] **Pits/holes** - Cannot pass unless flying
  - Verification: Blocks ground movement
- [ ] **Fire** - Damages player, can be extinguished
  - Verification: Contact damages, tears put out
- [ ] **Spikes** - Damages on contact
  - Verification: Walking on spikes hurts player
- [ ] **Tinted rocks** - Special marked rocks with rewards
  - Verification: Bombing drops soul heart or small chest

### Room Transitions
- [ ] **Door transitions** - Walking through door loads next room
  - Verification: Touching door loads connected room
- [ ] **Spawn at entry door** - Player appears near door entered from
  - Verification: Enter from south = spawn at south door
- [ ] **Spawn offset reduced** - Closer to door edge (~24px)
  - Verification: Player spawns close to door, not center
- [ ] **Movement pause on entry** - Brief pause (~100ms) prevents rushing
  - Verification: Holding direction doesn't immediately move
- [ ] **Transition stability** - No crashes during room changes
  - Verification: Can transition 100+ times without crash

### Room Persistence
- [ ] **Dead enemies stay dead** - Cleared enemies don't respawn
  - Verification: Leave and return, enemies still gone
- [ ] **Collected pickups stay collected** - No respawning items
  - Verification: Leave and return, pickup still gone
- [ ] **Destroyed obstacles stay destroyed** - Rocks/poop don't reset
  - Verification: Leave and return, obstacles still destroyed
- [ ] **Room clear state persists** - Doors stay open
  - Verification: Leave and return, doors still open

### Room Completion
- [ ] **Doors lock on entry** - Until enemies cleared
  - Verification: Cannot leave room with enemies alive
- [ ] **Doors unlock on clear** - All enemies dead opens doors
  - Verification: Last enemy death opens all doors
- [ ] **Clear room drops** - Pickup can spawn on clear
  - Verification: Room clear can spawn reward

---

## Room Types

### Standard Rooms
- [ ] **Normal rooms** - Enemies and obstacles (70%)
  - Verification: Most rooms have enemies
- [ ] **Empty rooms** - No enemies, maybe pickups (10%)
  - Verification: Some rooms are empty
- [ ] **Challenge rooms** - Full health entry, 3 waves, reward
  - Verification: Challenge icon, requires full HP

### Special Rooms
- [ ] **Starting room** - Safe room, no enemies
  - Verification: First room of floor is safe
- [ ] **Treasure room** - 1 key entry (after B1), 1 item pedestal, YELLOW on minimap
  - Verification: Gold door, item inside, yellow minimap icon
- [ ] **Shop room** - MANDATORY every floor, items for coins
  - Verification: Every floor has shop with purchasable items
- [ ] **Boss room** - Floor boss, drops item and trapdoor
  - Verification: Large enemy, item drop, hole to next floor
- [ ] **Secret room** - Bomb wall to enter, rare pickups
  - Verification: Hidden wall, bombing reveals entrance
- [ ] **Super secret room** - Adjacent to only 1 room
  - Verification: Harder to find than regular secret room
- [ ] **Sacrifice room** - Floor spikes, angel room chance (~14%)
  - Verification: Spikes in room, taking damage has reward chance
- [ ] **Curse room** - Spiked door damages on enter/exit (50%)
  - Verification: Door spikes, red chests inside
- [ ] **Arcade** - Even floors, 5+ coins, slot machines
  - Verification: Gambling machines for coins
- [ ] **Library** - 1 key, book items
  - Verification: Books on pedestals

---

## Floor/Level Structure

### Floor Progression
- [ ] **Basement I/II** - Chapter 1, basic enemies, 7-11 rooms
  - Verification: First floors have basic enemies
- [ ] **Caves I/II** - Chapter 2, medium enemies, 11-15 rooms
  - Verification: Harder enemies, more rooms
- [ ] **Depths I/II** - Chapter 3, hard enemies, 15-19 rooms
  - Verification: Difficult enemies, many rooms
- [ ] **Womb I/II** - Chapter 4, very hard, 9-11 rooms
  - Verification: Toughest enemies
- [ ] **Cathedral/Sheol** - Chapter 5, boss rush
  - Verification: Multiple boss fights
- [ ] **Chest/Dark Room** - Chapter 6, finale
  - Verification: Final area

### Map Generation
- [ ] **9x8 grid layout** - Rooms placed on grid
  - Verification: Map fits 9x8 cell structure
- [ ] **Breadth-first expansion** - From center outward
  - Verification: Map grows organically
- [ ] **No loops** - Dead-end based layout
  - Verification: Cannot loop back through different path
- [ ] **Boss room furthest** - From starting room
  - Verification: Boss is at longest path from start
- [ ] **Dead ends become special rooms** - Boss/treasure/shop at ends
  - Verification: Special rooms have single entrance
- [ ] **Room count scales with floor** - random(2)+5+floor*2.6
  - Verification: Later floors have more rooms

### Fog of War
- [ ] **Rooms hidden until visited** - Minimap shows only explored
  - Verification: Unvisited rooms not shown
- [ ] **Adjacent rooms show as ?** - When connected to current
  - Verification: Nearby rooms show outline only
- [ ] **Compass item reveals icons** - Shows room types
  - Verification: Item reveals special room locations
- [ ] **Map item reveals layout** - Shows all room positions
  - Verification: Item reveals full map shape

---

## Minimap

### Minimap Display
- [ ] **Top-right corner position** - Always visible
  - Verification: Minimap in top-right
- [ ] **Current room highlighted** - White/bright color
  - Verification: Easy to identify current location
- [ ] **Room type colors** - Boss=red, treasure=YELLOW, shop=cyan
  - Verification: Colors match room types
- [ ] **Visited vs unvisited** - Different opacity/style
  - Verification: Can tell which rooms explored

### Minimap Interaction
- [ ] **Tab tap cycles size** - Small/medium/hidden
  - Verification: Tapping Tab changes minimap size
- [ ] **Tab hold shows full map** - Large overlay
  - Verification: Holding Tab shows large transparent map

---

## Enemy System

### Enemy Spawning
- [ ] **Spawn animation** - Enemies play spawn animation on room entry
  - Verification: Enemies appear with animation
- [ ] **Spawn invulnerability** - Cannot be hit during spawn (~500ms)
  - Verification: Tears pass through spawning enemies
- [ ] **No movement during spawn** - Enemies frozen while spawning
  - Verification: Enemies don't move until animation done
- [ ] **No firing during spawn** - Enemies can't attack while spawning
  - Verification: Enemies don't shoot until active

### Enemy States
- [ ] **Stunned state** - Cannot move or fire, CAN take damage
  - Verification: Stunned enemy is helpless but damageable
- [ ] **Active state** - Normal behavior
  - Verification: Enemy moves and attacks
- [ ] **Death state** - Death animation, drops, removal
  - Verification: Enemy death plays animation

### Ground Enemy Collision
- [ ] **Non-flying enemies collide with obstacles** - Rocks, poop, etc.
  - Verification: Ground enemies path around objects
- [ ] **Pathfinding/avoidance** - Enemies navigate around obstacles
  - Verification: Enemies don't get stuck on rocks
- [ ] **Flying enemies ignore obstacles** - Pass over rocks/pits
  - Verification: Flying enemies move freely

### Basement Enemies (Chapter 1)
- [ ] **Fly** - 4 HP, wander randomly, contact, FLYING
  - Verification: Random movement, damages on touch
- [ ] **Attack Fly** - 6 HP, chase player, contact, FLYING
  - Verification: Moves toward player
- [ ] **Pooter** - 8 HP, drift toward player, occasional shot, FLYING
  - Verification: Slow chase, fires blood
- [ ] **Gaper** - 12 HP, walk toward player, contact, GROUND
  - Verification: Chases player, speeds up on sight
- [ ] **Frowning Gaper** - 15 HP, walk toward player, contact, GROUND
  - Verification: Similar to Gaper, tougher
- [ ] **Horf** - 10 HP, stationary, fires when player in line, GROUND
  - Verification: Doesn't move, shoots horizontally/vertically
- [ ] **Hopper** - 10 HP, hop around, contact, GROUND
  - Verification: Jumps in random directions
- [ ] **Charger** - 15 HP, wander, charge when aligned, GROUND
  - Verification: Charges in straight line when sees player
- [ ] **Clotty** - 10 HP, wander, 4-directional shots, GROUND
  - Verification: Fires in cardinal directions
- [ ] **Spider** - 6 HP, erratic movement, contact, GROUND
  - Verification: Unpredictable movement pattern
- [ ] **Trite** - 10 HP, leaps at player, contact, GROUND
  - Verification: Jump attack toward player

### Champion Enemies
- [ ] **Red champion** - 2x HP
  - Verification: Red tint, double health
- [ ] **Yellow champion** - Faster movement
  - Verification: Yellow tint, faster
- [ ] **Blue champion** - Extra projectiles
  - Verification: Blue tint, more shots
- [ ] **Green champion** - Spawns fly on death
  - Verification: Green tint, fly spawns
- [ ] **Black champion** - 2x damage
  - Verification: Black tint, hits harder
- [ ] **White champion** - HP regeneration
  - Verification: White tint, heals over time

### Enemy Death
- [ ] **No damage numbers** - NO floating numbers on hit
  - Verification: Damage does NOT show numbers
- [ ] **Death animation** - Enemy plays death animation
  - Verification: Visual feedback on kill
- [ ] **Drop roll on death** - Chance to drop pickup
  - Verification: Dead enemies can drop items
- [ ] **No crashes on death** - Stable enemy removal
  - Verification: Killing any enemy 10+ times doesn't crash

---

## Boss System

### Boss Room
- [ ] **Boss room entry** - From regular floor
  - Verification: Door leads to boss room
- [ ] **Boss spawns on entry** - Boss appears when player enters
  - Verification: Boss is present in room
- [ ] **Boss health pool** - Large HP (varies by boss)
  - Verification: Boss takes many hits

### Chapter 1 Bosses
- [ ] **Monstro** - 250 HP, hop/spit/jump attacks
  - Verification: Three attack patterns, defeats at 0 HP
- [ ] **Duke of Flies** - 110 HP, spawns flies, diagonal bounce
  - Verification: Summons flies, bounces off walls
- [ ] **Larry Jr.** - 22 HP per segment, cardinal movement, splits
  - Verification: Segmented worm, destroyable segments
- [ ] **Gemini** - 85+45 HP, tethered pair, phase 2 fast chase
  - Verification: Two connected enemies, small one faster after big dies
- [ ] **The Haunt** - 60+40x3 HP, Lil Haunts first, brimstone attack
  - Verification: Three small ghosts protect main boss

### Boss Rewards
- [ ] **Item drop** - Boss drops item from boss pool
  - Verification: Item pedestal appears after kill
- [ ] **Heart drops** - Based on damage taken
  - Verification: Hearts spawn after boss death
- [ ] **Trapdoor spawn** - To next floor
  - Verification: Hole appears to descend
- [ ] **Devil/Angel room chance** - Door may appear
  - Verification: Special door can spawn after boss

---

## Devil and Angel Rooms

### Devil Room
- [ ] **Spawn after boss** - Based on calculated chance
  - Verification: Door appears after boss kill
- [ ] **Red heart damage reduces chance** - -35%
  - Verification: Taking red damage lowers spawn rate
- [ ] **Goat Head guarantees spawn** - 100% chance
  - Verification: Item makes devil room always appear
- [ ] **Health cost items** - Pay with heart containers
  - Verification: Items cost 1-2 hearts
- [ ] **Devil pool items** - Brimstone, Dead Cat, etc.
  - Verification: Powerful dark items available

### Angel Room
- [ ] **Replaces devil room** - If devil deals refused
  - Verification: Angel room instead of devil
- [ ] **Requires skipping devil deals** - Cannot have taken any
  - Verification: Previous devil deal = no angel room
- [ ] **Free items** - No health cost
  - Verification: Items are free to take
- [ ] **One item limit** - Taking one removes others
  - Verification: Choosing item makes others vanish
- [ ] **Angel pool items** - Sacred Heart, Holy Mantle, etc.
  - Verification: Holy/protective items

---

## Bombs and Keys

### Bomb Usage
- [ ] **E key to place bomb** - Drops at player position
  - Verification: Pressing E places bomb
- [ ] **60 damage explosion** - High damage
  - Verification: Bomb deals 60 to enemies
- [ ] **3x3 tile radius** - Area of effect
  - Verification: Explosion covers 9 tiles
- [ ] **Destroys rocks** - Removes rock obstacles
  - Verification: Bomb destroys adjacent rocks
- [ ] **Destroys poop** - Instantly
  - Verification: Bomb destroys poop
- [ ] **Opens secret rooms** - Bomb adjacent wall
  - Verification: Bombing correct wall opens passage
- [ ] **Damages player in radius** - 1 heart
  - Verification: Standing in explosion hurts player
- [ ] **Tinted rock rewards** - Bombing special rocks
  - Verification: Tinted rock drops soul heart/chest

### Key Usage
- [ ] **Open treasure rooms** - 1 key cost
  - Verification: Key consumed, door opens
- [ ] **Open shops** - 1 key cost (if locked)
  - Verification: Key consumed, door opens
- [ ] **Open locked chests** - 1 key per chest
  - Verification: Key consumed, chest opens
- [ ] **Open locked doors** - 1 key between rooms
  - Verification: Key consumed, door opens
- [ ] **Open libraries** - 1 key cost
  - Verification: Key consumed, door opens

---

## UI Elements

### Health Display
- [ ] **Heart containers** - Top of screen
  - Verification: Hearts visible at top
- [ ] **Red hearts first** - Then soul/black/bone
  - Verification: Correct heart order
- [ ] **Empty containers shown** - Unfilled hearts visible
  - Verification: Missing health is clear
- [ ] **Max 12 displayed** - Plus soul hearts after
  - Verification: UI handles full health bar

### Resource Display
- [ ] **Key count** - With key icon
  - Verification: Shows number of keys
- [ ] **Bomb count** - With bomb icon
  - Verification: Shows number of bombs
- [ ] **Coin count** - With coin icon
  - Verification: Shows number of coins

### Stats Display
- [ ] **Damage stat** - Current damage value
  - Verification: Shows DMG value
- [ ] **Speed stat** - Current movement speed
  - Verification: Shows SPD value
- [ ] **Stats always visible** - On screen during gameplay
  - Verification: Can see stats while playing

### Active Item Display
- [ ] **Active item icon** - Shows current active
  - Verification: Active item visible
- [ ] **Charge bar** - Shows charges/max
  - Verification: Charge meter visible
- [ ] **Spacebar indicator** - Shows how to use
  - Verification: Clear activation method

---

## Screens

### Title Screen
- [ ] **Start game option** - Begin new run
  - Verification: Can start game
- [ ] **Character selection** - Choose character (if unlocked)
  - Verification: Can pick different characters
- [ ] **Options access** - Settings menu
  - Verification: Can access options

### Pause Menu
- [ ] **ESC to pause** - Pauses gameplay
  - Verification: ESC stops game
- [ ] **Resume option** - Continue playing
  - Verification: Can unpause
- [ ] **Exit to menu option** - Leave run
  - Verification: Can quit to title

### Game Over Screen
- [ ] **Death message** - Shows player died
  - Verification: Clear death indication
- [ ] **Run statistics** - Floors reached, items collected
  - Verification: Shows run summary
- [ ] **Restart option** - Start new run
  - Verification: Can restart immediately
- [ ] **Menu option** - Return to title
  - Verification: Can go to title screen

### Victory Screen
- [ ] **Win message** - Shows player won
  - Verification: Clear victory indication
- [ ] **Final statistics** - Full run summary
  - Verification: Shows complete stats
- [ ] **Unlocks display** - New unlocks (if any)
  - Verification: Shows what was unlocked

---

## Controls

### Movement Controls
- [ ] **W** - Move up
  - Verification: W moves player up
- [ ] **A** - Move left
  - Verification: A moves player left
- [ ] **S** - Move down
  - Verification: S moves player down
- [ ] **D** - Move right
  - Verification: D moves player right
- [ ] **Diagonal movement** - WA, WD, SA, SD combinations
  - Verification: Holding two keys = diagonal

### Firing Controls
- [ ] **Arrow Up** - Fire up
  - Verification: Up arrow fires upward
- [ ] **Arrow Left** - Fire left
  - Verification: Left arrow fires left
- [ ] **Arrow Down** - Fire down
  - Verification: Down arrow fires down
- [ ] **Arrow Right** - Fire right
  - Verification: Right arrow fires right

### Action Controls
- [ ] **E** - Drop bomb
  - Verification: E places bomb
- [ ] **Space** - Use active item
  - Verification: Space activates item
- [ ] **Tab** - Toggle/hold map
  - Verification: Tab controls minimap
- [ ] **Q** - Drop card/pill
  - Verification: Q drops consumable
- [ ] **ESC** - Pause game
  - Verification: ESC pauses

---

## Characters

### Starting Character
- [ ] **Isaac** - 3 red hearts, balanced stats, no starting items
  - Verification: Default character works correctly

### Unlockable Characters
- [ ] **Magdalene** - 4 hearts, Yum Heart active
  - Verification: Unlocks after condition, unique stats
- [ ] **Cain** - 2 hearts, Lucky Foot, 1 key start
  - Verification: Unlocks after condition, unique stats
- [ ] **Judas** - 1 heart, Book of Belial
  - Verification: Unlocks after condition, unique stats
- [ ] **Eve** - 2 red + 2 soul, Whore of Babylon
  - Verification: Unlocks after condition, unique stats
- [ ] **Azazel** - 3 black hearts, short Brimstone + flight
  - Verification: Unlocks after condition, unique gameplay
- [ ] **Lazarus** - 3 hearts, revives with +damage
  - Verification: Unlocks after condition, revival mechanic
- [ ] **The Lost** - 0 hearts, spectral/flight, free devil deals
  - Verification: Unlocks after condition, unique challenge

---

## Save System

### Run State (Lost on Death)
- [ ] **Current floor** - Saved during run
  - Verification: Can pause and resume run
- [ ] **Health state** - All heart types
  - Verification: Health preserved
- [ ] **Items collected** - Passive and active
  - Verification: Items preserved
- [ ] **Pickups** - Coins, bombs, keys, consumable
  - Verification: Resources preserved
- [ ] **Room states** - Cleared rooms, etc.
  - Verification: Progress preserved
- [ ] **Lost on death** - Run state wiped
  - Verification: Death = fresh start

### Persistent Progress
- [ ] **Unlocked characters** - Survives death
  - Verification: Character unlocks persist
- [ ] **Unlocked items** - New pool additions
  - Verification: Item unlocks persist
- [ ] **Statistics tracking** - Deaths, wins, time
  - Verification: Stats accumulate across runs
- [ ] **Achievements** - Completed challenges
  - Verification: Achievements persist

---

## Audio

### Sound Effects
- [ ] **Tear fire sound** - Wet splat
  - Verification: Sound plays on shooting
- [ ] **Tear hit enemy** - Squelch
  - Verification: Sound plays on hit
- [ ] **Player hurt** - Pain grunt + heartbeat
  - Verification: Sound plays on damage
- [ ] **Pickup collect** - Chime/sparkle
  - Verification: Sound plays on pickup
- [ ] **Door unlock** - Stone grinding
  - Verification: Sound plays on clear
- [ ] **Item collect** - Triumphant jingle
  - Verification: Sound plays on item get
- [ ] **Enemy death** - Splatter + cry
  - Verification: Sound plays on kill
- [ ] **Explosion** - Deep boom
  - Verification: Sound plays on bomb

### Music
- [ ] **Floor-specific music** - Different per chapter
  - Verification: Music changes with floor
- [ ] **Boss fight music** - Intense tempo
  - Verification: Music changes for boss
- [ ] **Special room music** - Item/devil/angel rooms
  - Verification: Special rooms have unique music

---

## Visual Design

### Art Direction
- [ ] **Top-down perspective** - Slight depth
  - Verification: Visuals look top-down
- [ ] **Pixel art style** - Grotesque/cute horror
  - Verification: Art matches Isaac aesthetic
- [ ] **32x32 tile size** - Or 16x16/48x48
  - Verification: Consistent tile sizing
- [ ] **Dark palette** - Browns/grays for environment
  - Verification: Appropriately dark colors
- [ ] **Bright pickups** - Stand out visually
  - Verification: Items easy to see

### Animations
- [ ] **Player idle** - Breathing/movement
  - Verification: Player animates when still
- [ ] **Player movement** - Walking animation
  - Verification: Player animates when moving
- [ ] **Player damage** - Flash/blink
  - Verification: Visual feedback on hit
- [ ] **Enemy animations** - Idle, move, attack, death
  - Verification: Enemies have animations
- [ ] **Tear animations** - Wobble, splash
  - Verification: Tears have visual life

---

## Accessibility Options

- [ ] **Game speed adjustment** - 0.5x to 1.0x
  - Verification: Can slow game down
- [ ] **Colorblind mode** - Alternative colors
  - Verification: Mode available in options
- [ ] **High contrast mode** - Enhanced visibility
  - Verification: Mode available in options
- [ ] **Screen shake toggle** - Enable/disable
  - Verification: Can turn off shake
- [ ] **Flash reduction** - Reduced flashing
  - Verification: Mode available in options
- [ ] **Rebindable keys** - Custom controls
  - Verification: Can change key bindings
- [ ] **Aim assist** - Slight homing
  - Verification: Toggle available
- [ ] **Auto-fire toggle** - Hold to fire
  - Verification: Toggle available
- [ ] **Item descriptions** - On pickup info
  - Verification: Shows item info
- [ ] **Enemy health bars** - Optional display
  - Verification: Toggle available
- [ ] **Damage numbers** - Must be OFF by default
  - Verification: No floating numbers (not Isaac style)

---

## Stability Requirements

### Crash Prevention
- [ ] **No crash on enemy kill** - Any enemy type
  - Verification: Kill each enemy 10+ times
- [ ] **No crash on room transition** - Any direction
  - Verification: Transition 100+ times
- [ ] **No crash on item pickup** - Any item
  - Verification: Pick up various items
- [ ] **No crash on boss death** - Any boss
  - Verification: Kill each boss multiple times
- [ ] **No crash on floor transition** - Via trapdoor
  - Verification: Descend floors repeatedly

### Memory/Performance
- [ ] **No memory leaks** - Extended play stable
  - Verification: Play 30+ minutes without slowdown
- [ ] **Consistent frame rate** - No stuttering
  - Verification: Smooth gameplay
- [ ] **Object cleanup** - Dead entities removed
  - Verification: No accumulating objects

---

## Coverage Summary

**Total features: 287**
- Core Mechanics: 16
- Health System: 10
- Pickup System: 17
- Item System: 31
- Room System: 21
- Room Types: 14
- Floor/Level Structure: 13
- Minimap: 6
- Enemy System: 29
- Boss System: 13
- Devil and Angel Rooms: 10
- Bombs and Keys: 14
- UI Elements: 12
- Screens: 12
- Controls: 15
- Characters: 8
- Save System: 10
- Audio: 16
- Visual Design: 10
- Accessibility Options: 11
- Stability Requirements: 8

**Verified: 0**
**Coverage: 0%**
