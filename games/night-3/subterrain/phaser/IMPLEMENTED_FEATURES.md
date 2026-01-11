# Implemented Features: Subterrain (Phaser)

## Core Mechanics
- [x] WASD movement
- [x] Mouse aim (player rotation follows cursor)
- [x] Click to melee attack
- [x] Tile-based collision detection
- [x] Camera follow with smooth lerp
- [x] Dodge roll (Space/right-click, i-frames)
- [x] Stamina system (melee costs stamina, regen 5/sec)
- [x] Sprint system (Shift key, drains stamina)

## Survival System
- [x] Health meter (0-100)
- [x] Hunger meter (decays 0.1/min)
- [x] Thirst meter (decays 0.2/min)
- [x] Fatigue meter (decays 0.067/min)
- [x] Personal infection meter
- [x] Global infection timer (0.1%/min)
- [x] Meter penalties at thresholds (hunger/thirst/fatigue effects)
- [x] Health drain from high hunger/thirst/infection
- [x] Fatigue movement penalty (50%: -10%, 75%: -25%)

## Combat System
- [x] Melee weapons (fists, shiv, pipe club, stun baton)
- [x] Ranged weapons (pistol)
- [x] Weapon switching (5-7 keys)
- [x] Weapon durability system
- [x] Weapon breaking mechanic
- [x] Critical hit system (15% chance, 2x damage)
- [x] Floating damage numbers
- [x] Knockback effects (pipe club)
- [x] Stun effects (stun baton)
- [x] Bleed chance (shiv - 20%)
- [x] Accuracy and spread (ranged)
- [x] Magazine/ammo system
- [x] Armor damage reduction

## Status Effects
- [x] Bleeding (2 damage/sec DOT)
- [x] Stunned (cannot move/attack)
- [x] Slowed (reduced movement)
- [x] Status effect display on enemies
- [x] Status effect tick damage

## Enemy AI
- [x] Detection range per enemy type
- [x] Chase behavior when player spotted
- [x] Melee attack when in range
- [x] Ranged attack (spitter acid projectiles)
- [x] Cocoon spawning behavior
- [x] Cocoon infection aura
- [x] Crawler lunge attack (80 units range)
- [x] Brute charge attack (2x speed, wall stun)
- [x] Stunned state on wall collision
- [x] Status effect processing

## Map System
- [x] 5 sectors (Hub, Storage, Medical, Research, Escape)
- [x] Procedural internal wall generation
- [x] Door tiles for sector transitions
- [x] Correct spawn positions on transition (top->bottom, etc)
- [x] Room persistence (enemies/blood saved between visits)
- [x] Darkness overlay for unpowered sectors

## Power System
- [x] Powered/unpowered state per sector
- [x] Infection gain in unpowered sectors
- [x] Power control panel interaction
- [x] Power budget (500 max)
- [x] Sector power costs (100/150/200/300)
- [x] Power cycling UI

## Items and Inventory
- [x] Inventory array (food, water, medkit, antidote, materials, weapons)
- [x] Item use with hotkeys (1-4)
- [x] Floor item spawns from enemy drops
- [x] Floor item collection (proximity-based)
- [x] Container looting (E key)
- [x] Weighted drop system for enemy loot
- [x] Ammo pickup handling (+10 bullets)
- [x] Electronics drop
- [x] Data chip for tier 2 unlock

## Crafting System
- [x] Workbench interaction
- [x] Tier 1 recipes (Shiv, Pipe Club, Bandage, Torch)
- [x] Tier 2 recipes (Pistol, Ammo, Antidote, Stun Baton, Armor)
- [x] Material consumption
- [x] Crafting time passage
- [x] Recipe unlocking with data chip

## Key Items
- [x] Keycard detection (found in research containers)
- [x] Keycard blocks escape pod until found
- [x] Data chip for Tier 2 unlock

## Facilities
- [x] Workbench (crafting)
- [x] Bed (fatigue reduction)
- [x] Medical Station (heal when powered)
- [x] Escape Pod (victory trigger)
- [x] Power Panel (power management)
- [x] Storage Locker

## UI/HUD
- [x] Health display (HP value)
- [x] Hunger/Thirst/Fatigue meters
- [x] Infection display
- [x] Global infection percentage
- [x] Sector name display
- [x] Time display (game hours:minutes)
- [x] Quick slot indicators (1-4)
- [x] Weapon display (name, ammo, durability)
- [x] Stamina display
- [x] Control hints at bottom
- [x] Debug overlay (Q key toggle)

## Visual Effects
- [x] Damage flash overlay (red screen)
- [x] Low health pulsing vignette
- [x] Infection screen tint (green)
- [x] Screen shake on damage
- [x] Blood splatter on enemy death
- [x] Death burst particles
- [x] Floating text system
- [x] Healing particles (green)
- [x] Cure particles (cyan)
- [x] Loot sparkle effect
- [x] Floor item bobbing animation
- [x] Muzzle flash (ranged weapons)
- [x] Dodge flicker animation
- [x] Brute charge orange tint
- [x] Stunned yellow tint

## Stats Tracking
- [x] Kill count
- [x] Total damage dealt
- [x] Total damage taken
- [x] Critical hit count
- [x] Containers looted
- [x] Items used
- [x] Sectors visited

## End Screens
- [x] Game Over with reason
- [x] Performance rating on death (SURVIVOR/FIGHTER/STRUGGLER/VICTIM)
- [x] Detailed stats display
- [x] Victory screen
- [x] Efficiency rating on victory (S/A/B/C/D)
- [x] Restart with SPACE key

## Input
- [x] WASD movement
- [x] Mouse aim
- [x] Click to attack
- [x] Right-click to dodge
- [x] E to interact
- [x] 1-4 for consumables
- [x] 5-7 for weapon switching
- [x] Q for debug overlay
- [x] SPACE for dodge
- [x] SHIFT for sprint
