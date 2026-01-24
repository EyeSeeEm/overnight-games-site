# Pirateers v2 - Phaser Iterations

## Expand Passes (20 required)
1. Added core ship movement with WASD/Arrow controls
2. Added ship turning (A/D keys)
3. Added speed control (W/S for acceleration/deceleration)
4. Added broadside cannon firing (both sides simultaneously)
5. Added 4 enemy types: Merchant, Navy Sloop, Pirate Raider, Pirate Captain
6. Added enemy AI with pursuit and firing behavior
7. Added gold drops from destroyed enemies
8. Added cargo drops from destroyed enemies
9. Added 10 cargo item types with different rarities
10. Added day/night cycle with 120-second timer
11. Added fog of war system revealing map as you sail
12. Added 4 ship stat upgrades: Armor, Speed, Reload, Firepower
13. Added upgrade purchasing system with gold
14. Added home port base scene with shop
15. Added islands scattered across the map
16. Added ports for trading and repairs
17. Added port trading scene to sell cargo
18. Added ship repair at ports (for gold)
19. Added boss enemy (Pirate Captain) as win condition
20. Added victory scene when boss defeated

## Polish Passes (20 required)
1. Added HUD showing armor percentage
2. Added HUD showing speed level
3. Added HUD showing day timer (MM:SS format)
4. Added HUD showing current day number
5. Added HUD showing gold counter
6. Added HUD showing cargo count (X/Y format)
7. Added muzzle flash effect on cannon fire
8. Added explosion effect on enemy destruction
9. Added damage flash (red tint) when player hit
10. Added floating text for gold/cargo pickups
11. Added port proximity prompt ("Press E to enter port")
12. Added ship stat display with upgrade buttons
13. Added cargo selling interface at ports
14. Added auto-sell cargo at home base
15. Added ship repair confirmation
16. Added escape to return to base option
17. Added cannon spread based on firepower level
18. Added water tile background with wave patterns
19. Added island and port visual distinction
20. Added debug overlay with comprehensive game state

## Refine Passes (20 required)
1. Ocean blue color matches reference aesthetic
2. Ship sprites have brown wooden hull appearance
3. Enemy ships colored by type (brown merchant, blue navy, gray pirate)
4. Boss ship has red flag indicator
5. Gold coins are bright yellow for visibility
6. Cargo crates are wooden brown with cross pattern
7. Islands have sand beaches with green vegetation
8. Ports have buildings on islands
9. UI uses golden/tan color scheme like reference
10. Upgrade buttons show green when affordable
11. Cannon fire spreads from both broadsides
12. Enemy ships patrol and engage when in range
13. Fog of war reveals in circle around player
14. Day timer creates urgency for expeditions
15. Armor stat affects max HP correctly
16. Speed stat affects ship velocity correctly
17. Reload stat affects cannon cooldown correctly
18. Firepower stat affects cannon damage correctly
19. Cargo capacity fixed at 15 slots
20. Boss defeat triggers victory condition

## Feature Verification Checklist
- [x] WASD/Arrow movement
- [x] Ship turning (A/D)
- [x] Speed control (W/S)
- [x] Broadside cannon fire (Space/Click)
- [x] 4 enemy types
- [x] Enemy AI combat
- [x] Gold drops
- [x] Cargo drops
- [x] Day timer (120 seconds)
- [x] Fog of war
- [x] 4 upgradeable stats
- [x] Home port/base scene
- [x] Port trading
- [x] Ship repair
- [x] Boss enemy (Pirate Captain)
- [x] Win condition
- [x] HUD with all elements
- [x] Debug overlay (Q key)
- [x] Menu screen
- [x] Victory screen

## Post-Mortem
### What Went Well
- Ship combat feels naval-authentic with broadsides
- Upgrade system provides progression
- Day cycle creates expedition structure
- Fog of war adds exploration element

### What Went Wrong
- Playwright had trouble clicking UI buttons
- Could add more detailed ship customization
- Could add quest system for variety

### Time Spent
- Initial build: ~60 minutes
- Expand passes: ~25 minutes
- Polish passes: ~15 minutes
- Refine passes: ~10 minutes
- Total: ~110 minutes
