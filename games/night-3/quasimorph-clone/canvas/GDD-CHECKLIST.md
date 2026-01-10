# Full Feature Checklist - Quasimorph Clone (Canvas)

## Controls
- [ ] WASD/Arrow movement
- [ ] Click to shoot
- [ ] Space - end turn
- [ ] Mouse hover for hit chance
- [ ] Stance change (1/2/3 for sneak/walk/run)
- [ ] Number keys for quick slots

## Player Abilities
- [ ] Sneak stance (1 AP)
- [ ] Walk stance (2 AP)
- [ ] Run stance (3 AP, no inventory)
- [ ] Basic movement (1 AP per tile)
- [ ] Fire weapon (1-2 AP)
- [ ] Reload weapon (1 AP)
- [ ] Use item (1 AP)
- [ ] Throw grenade (1 AP)

## Weapons/Items
- [ ] Pistol (1 AP, 6 range, 75% accuracy)
- [ ] SMG (1 AP, 5 range, 60% accuracy, burst)
- [ ] Shotgun (2 AP, 3 range, 80% accuracy, pellets)
- [ ] Combat Rifle (2 AP, 10 range, 70% accuracy)
- [ ] Sniper Rifle (2 AP, 15 range, 85% accuracy)
- [ ] Bandage (heal light/moderate wounds)
- [ ] Medkit (heal up to severe, +30 HP)
- [ ] Stim Pack (+1 AP this turn)
- [ ] Frag Grenade (40 dmg, 2-tile radius)
- [ ] Ammo types (9mm, 7.62mm, 12ga, .50cal)

## Enemy Types
- [ ] Guard (50 HP, pistol, patrols)
- [ ] Soldier (75 HP, SMG, aggressive)
- [ ] Heavy (120 HP, shotgun, slow)
- [ ] Sniper (40 HP, rifle, long range)
- [ ] Corrupted/Possessed (80 HP, claws, fast)
- [ ] Corrupted Elite (higher HP variant)

## Combat System
- [ ] Turn-based AP spending
- [ ] Cover system (half 25%, full 50% reduction)
- [ ] Line of sight raycasting
- [ ] Fog of war
- [ ] Accuracy calculation (distance, cover, skill)
- [ ] Damage calculation with armor

## Corruption System
- [ ] Corruption meter (0-1000)
- [ ] Increases per turn (+1 base)
- [ ] Increases on combat (+2 fire, +5 kill, +3 damage)
- [ ] Threshold 200: 10% transform chance
- [ ] Threshold 400: 25% transform, visual tint
- [ ] Threshold 600: 50% transform, elite spawns
- [ ] Threshold 800: All transform, boss spawn
- [ ] Threshold 1000: Extraction blocked

## Wound System
- [ ] Head wounds (-20% accuracy)
- [ ] Torso wounds (-1 max AP)
- [ ] Arm wounds (-15% accuracy each)
- [ ] Leg wounds (-1 movement each)
- [ ] Bleeding damage per turn
- [ ] Wound treatment with items

## Level/Progression
- [ ] Procedural room generation
- [ ] Multi-floor (3 floors)
- [ ] Room transitions via doors
- [ ] Extraction zone on final floor
- [ ] XP from kills
- [ ] Level up (+10 HP, +2 armor)

## UI Elements
- [ ] HP bar display
- [ ] AP pips display
- [ ] Current stance indicator
- [ ] Weapon name and ammo count
- [ ] Item counts (bandages, medkits, stims, grenades)
- [ ] Armor value
- [ ] Corruption meter with value
- [ ] Floor indicator
- [ ] Kill counter
- [ ] Turn counter
- [ ] Level and XP bar
- [ ] Minimap with enemy tracking
- [ ] Action log
- [ ] Hit chance on hover

## Game States
- [ ] Title/menu screen
- [ ] Gameplay state
- [ ] Player turn
- [ ] Enemy turn
- [ ] Game over screen
- [ ] Victory/extraction screen

## Visual Effects
- [ ] Muzzle flash on shots
- [ ] Blood splatter particles
- [ ] Floating damage numbers
- [ ] Screen shake on damage
- [ ] Corruption visual tint at high levels
- [ ] Enemy health bars
- [ ] Cover object textures
- [ ] Hazard tile effects (fire, toxic)
- [ ] Terminal with green cursor
- [ ] Extraction zone chevrons

## Loot System
- [ ] Loot containers in rooms
- [ ] Random drops (weapons, ammo, items)
- [ ] Terminal hacking for rewards

## Verification Progress

### Verified Working (Iterations 01-05):
- [x] WASD movement - working
- [x] Space - end turn - working
- [x] Stance change (1/2/3) - verified RUN/WALK
- [x] Turn system - turns advancing correctly
- [x] Corruption meter - incrementing per turn and action
- [x] Fog of war - working
- [x] Procedural room generation - different layouts each run
- [x] Enemy AI - soldiers and guards attacking player
- [x] Wound system - "leftLeg wounded!" confirmed
- [x] Floating damage numbers - "-2" visible
- [x] Blood splatter particles - red particles on hit
- [x] Action log - showing all combat events
- [x] Armor damage reduction - HP protected with Armor: 10
- [x] Poison/DoT damage - "Poisoned! -10 HP" confirmed
- [x] HP bar decreasing - dropped to 79/100
- [x] Enemy alert indicators - green "!" visible
- [x] Minimap - showing layout and enemies
- [x] UI elements - HP, AP, Stance, Weapon, Items, Armor all displayed
- [x] Loot containers visible - yellow squares on map
- [x] Terminals visible - teal objects on map

### Needs More Testing:
- [ ] Click to shoot (enemies weren't in line of sight)
- [ ] Kill enemies and gain XP
- [ ] Loot containers (E to loot)
- [ ] Floor transitions (reach extraction)
- [ ] Game over state
- [ ] Grenade throwing
