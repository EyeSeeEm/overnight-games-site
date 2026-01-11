# Implemented Features: System Shock 2D (Phaser)

## Core Mechanics
- [x] Twin-stick style controls (WASD + mouse aim)
- [x] Player rotation follows cursor
- [x] 8-direction movement
- [x] Sprint system (costs stamina)
- [x] Crouch system (slower, harder to detect)
- [x] Dodge roll with i-frames (SPACE)
- [x] Stamina system with regeneration
- [x] Energy system (flashlight, emergency heal)
- [x] Collision detection with walls and doors

## Combat System
- [x] Ranged weapons (pistol, shotgun, SMG, laser weapons)
- [x] Melee weapons (wrench, pipe, stun prod, laser rapier)
- [x] Critical hit system (15% chance, 2x damage)
- [x] Backstab bonus (1.5x damage from behind)
- [x] Weapon switching (1-6 keys)
- [x] Secondary weapon system (TAB to swap)
- [x] Reloading system
- [x] Magazine/reserve ammo tracking
- [x] Grenade throwing (right-click)
- [x] Explosions with area damage
- [x] Armor penetration system
- [x] Weapon condition/durability tracking

## Status Effects
- [x] Bleeding (DOT, 2 HP/sec)
- [x] Shocked/Stunned (cannot move/attack)
- [x] Irradiated (DOT, stacks up to 3x)
- [x] Cloaked (invisibility)
- [x] Status effect stacking
- [x] Duration-based effect expiry

## Weapons (10 total)
- [x] Wrench (melee, infinite durability)
- [x] Pipe (melee, knockback)
- [x] Stun Prod (melee, stun effect)
- [x] Laser Rapier (melee, bypasses armor)
- [x] Pistol (12 dmg, bullets)
- [x] Shotgun (8x6 pellets, shells)
- [x] SMG (8 dmg, fast fire, bullets)
- [x] Laser Pistol (20 dmg, energy, armor pen)
- [x] Laser Rifle (35 dmg, energy, armor pen)
- [x] Grenade Launcher (80 dmg, explosive)

## Enemy Types (8)
- [x] Cyborg Drone (melee, common)
- [x] Cyborg Soldier (ranged)
- [x] Cyborg Assassin (stealth, cloaks)
- [x] Cyborg Heavy (tank, slow, armored)
- [x] Mutant Crawler (swarm, fast, bleeds)
- [x] Mutant Brute (charge attack)
- [x] Maintenance Bot (patrol, alerts others)
- [x] Security Bot (aggressive, dual laser)

## Enemy AI
- [x] Patrol state (wander)
- [x] Chase state (pursue player)
- [x] Attack state (engage)
- [x] Alert timer system
- [x] Vision cone detection
- [x] Stealth detection (affected by crouch/darkness)
- [x] Charge behavior (Brutes)
- [x] Cloak/decloak behavior (Assassins)
- [x] Swarm behavior (continuous movement)
- [x] Status effect tracking

## Item System
- [x] Medkits (heal HP)
- [x] Bullets (pistol/SMG ammo)
- [x] Shells (shotgun ammo)
- [x] Energy cells (laser ammo/flashlight)
- [x] Grenades (throwable explosive)
- [x] Scrap (crafting currency)
- [x] Cyber Modules (upgrade currency)
- [x] Weighted random drops
- [x] Color-coded item types
- [x] Pickup particles/feedback

## Map System
- [x] Procedural room generation
- [x] Corridor connections
- [x] Door placement
- [x] Terminal placement
- [x] Spawn position logic
- [x] Exit placement
- [x] Tile-based collision

## UI/HUD
- [x] Weapon list (1-6)
- [x] Active weapon highlight
- [x] Secondary weapon indicator
- [x] Ammo display (all types)
- [x] Health/Energy/Stamina stats
- [x] Status effects display
- [x] Weapon description
- [x] Minimap
- [x] Message log
- [x] Controls hint
- [x] Crosshair
- [x] Floating damage numbers
- [x] Kill streak display

## Visual Effects
- [x] Flashlight cone with raycasting
- [x] Darkness overlay
- [x] Ambient lighting
- [x] Muzzle flash
- [x] Blood/spark particles
- [x] Explosion effects
- [x] Screen shake
- [x] Damage flash overlay
- [x] Low health pulsing vignette
- [x] Pickup sparkles
- [x] Death burst particles
- [x] Healing particles
- [x] Data particles (terminal hack)

## Screens
- [x] Game Over screen with stats
- [x] Victory screen with stats
- [x] Performance rating (S-D)
- [x] Time survived display
- [x] Detailed statistics display

## Input System
- [x] WASD movement
- [x] Mouse aim and shoot
- [x] Right-click grenade
- [x] SPACE dodge roll
- [x] SHIFT sprint
- [x] CTRL crouch
- [x] Q quick heal
- [x] E interact
- [x] F flashlight toggle
- [x] R reload
- [x] TAB weapon swap
- [x] 1-6 weapon select
- [x] G debug mode

## Stats Tracking
- [x] Kills
- [x] Damage dealt
- [x] Damage taken
- [x] Critical hits
- [x] Max kill streak
- [x] Shots fired/hit
- [x] Accuracy calculation
- [x] Terminals hacked
- [x] Items collected
- [x] Time played
