# Implemented Features: Derelict Ship (Canvas)

## Core Mechanics
- [x] WASD movement
- [x] Mouse aim/look
- [x] Shift to run (faster but more O2 drain)
- [x] F to toggle flashlight
- [x] E to interact (doors, items)
- [x] Left-click to attack
- [x] Q to toggle debug overlay
- [x] R to reload (ranged weapons)
- [x] G to throw grenade
- [x] 1-4 to switch weapons

## Vision System
- [x] Darkwood-style vision cone
- [x] 72-degree field of view
- [x] Flashlight extends range (180 to 600 pixels)
- [x] Ambient light around player
- [x] Darkness overlay with cone cutout
- [ ] Wall-blocked vision (raycasting)

## O2 System
- [x] Constant O2 drain
- [x] Idle drain rate (0.5/s)
- [x] Walking drain rate (0.67/s)
- [x] Running drain rate (1.33/s)
- [x] Combat drain (2 O2 per attack)
- [x] Low O2 warning
- [x] Death at 0 O2

## Health System
- [x] 100 HP max
- [x] Damage from enemies
- [x] Damage flash effect
- [x] Low health vignette
- [x] Death at 0 HP

## Combat - Melee
- [x] Pipe weapon (20 damage)
- [x] Wrench weapon (25 damage)
- [x] Fire Axe weapon (40 damage)
- [x] Stun Baton weapon (15 damage + 2s stun)
- [x] Attack cooldown based on weapon speed
- [x] Critical hits (15% chance, 2x damage)
- [x] Enemy knockback
- [x] Screen shake on hit
- [x] Blood particles/stains

## Combat - Ranged
- [x] Pistol (25 damage, 9mm ammo)
- [x] Revolver (45 damage, .44 ammo)
- [x] Crossbow (35 damage, bolts, silent)
- [x] Ammo tracking (9mm, .44, bolts)
- [x] Muzzle flash particles
- [x] Bullet projectiles
- [x] Non-silent weapons alert enemies

## Combat - Grenades
- [x] Grenade throwing (G key)
- [x] 2 second fuse
- [x] Radial damage falloff
- [x] Screen shake explosion
- [x] Explosion particles

## Stun Mechanic
- [x] Stun Baton stuns for 2 seconds
- [x] Stunned enemies can't move/attack
- [x] "STUNNED" indicator above enemy

## Enemy AI
- [x] Patrol state
- [x] Chase state
- [x] Alert state
- [x] Detection range
- [x] Attack cooldown
- [x] Health bars on damaged enemies
- [x] Sound detection (running attracts enemies)
- [x] Stalker invisibility (when stationary)
- [x] Mimic disguise (looks like item)
- [x] Hunter persistence (never gives up)
- [x] Bloater explosion on death

## Items
- [x] O2 Canister (S) +25 O2
- [x] O2 Canister (L) +50 O2
- [x] Medkit (S) +30 HP
- [x] Medkit (L) +60 HP
- [x] 9mm Ammo (+12 rounds)
- [x] .44 Ammo (+6 rounds)
- [x] Crossbow Bolts (+4 bolts)
- [x] Stimpack (+50% speed for 15s)
- [x] Flare (stored for later)
- [x] Frag Grenade (throwable)
- [x] Weapon pickups
- [x] Weighted item spawning

## Weapon System
- [x] Weapon switching (1-4 keys)
- [x] Melee vs ranged distinction
- [x] Weapon inventory tracking
- [x] Weapon damage varies
- [x] Weapon speed affects cooldown
- [ ] Weapon durability

## Ship Systems
- [x] Ship integrity (decay over time)
- [x] Death at 0% integrity
- [x] Sector display
- [ ] Power management
- [ ] System allocation

## Map/Rooms
- [x] Procedural room generation
- [x] Corridor connections
- [x] Blood stain atmosphere
- [x] Doors (locked/unlocked)
- [x] Escape pod (victory)
- [ ] Multiple sectors
- [ ] Keycards

## Minimap
- [x] Corner minimap (100x100px)
- [x] Floor layout display
- [x] Enemy positions (red dots)
- [x] Item positions (green dots)
- [x] Exit marker
- [x] Player position with direction
- [x] Semi-transparent background

## Spaceship Phase
- [x] Escape pod flight
- [x] Asteroid dodging
- [x] WASD ship controls
- [x] Hull HP (3 hits)
- [x] Parallax star field
- [x] Derelict ship shrinking behind
- [x] Progress bar
- [x] Victory on escape

## Visual Effects
- [x] Screen shake
- [x] Damage flash (red overlay)
- [x] Low health pulsing vignette
- [x] Floating damage numbers
- [x] Blood particles
- [x] Persistent blood stains
- [x] Pickup sparkle
- [x] Death burst particles
- [x] Orange enemy outlines
- [x] Glowing enemy eyes
- [x] Muzzle flash
- [x] Bullet trails
- [x] Explosion particles
- [x] Wall spark particles

## UI/HUD
- [x] O2 bar
- [x] HP bar
- [x] Flashlight battery bar
- [x] Ship integrity bar
- [x] Sector indicator
- [x] Message log
- [x] Crosshair
- [x] Debug overlay (Q key)
- [x] Weapon display
- [x] Ammo counter
- [x] Grenade/flare count
- [x] Stimpack timer
- [x] Minimap

## End Screens
- [x] Game over screen
- [x] Performance rating (LOST/SURVIVOR/FIGHTER/WARRIOR)
- [x] Victory screen
- [x] Efficiency rating (S/A/B/C/D)
- [x] Detailed stats display
- [x] Time survived
