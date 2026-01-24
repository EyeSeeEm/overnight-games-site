# Derelict - Survival Horror Game - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with player movement (WASD) and mouse aiming
2. Added 90-degree vision cone with 300px range as per GDD
3. Added O2 system with drain rates (idle/walk/run/combat)
4. Added HP system with damage and invincibility frames
5. Added 4 enemy types: Crawler, Shambler, Stalker, Ship Boss
6. Added 4 weapons: Pipe (melee), Pistol, Shotgun, SMG
7. Added room-based ship generation with connected layout
8. Added corridor system connecting rooms
9. Added door interaction system (E key)
10. Added item pickups: O2 canisters, medkits, weapons, ammo
11. Added floating text popups for pickups and damage
12. Added escape pod in final room
13. Added 3 ships: Tutorial, Derelict Alpha, Final Vessel
14. Added Space Mode for flying between derelict ships
15. Added ship boss that spawns crawlers at 50% HP
16. Added life support rooms that restore O2
17. Added flashlight toggle (F key) with battery system
18. Added reload mechanic (R key) for ranged weapons
19. Added particle systems: blood, sparks, muzzle flash
20. Added debug overlay (Q key) with all game stats

## Polish Passes (20 required)
1. Improved crawler enemy with 8 animated spider legs
2. Added crawler mandibles facing player direction
3. Improved shambler with hunched humanoid body and dripping slime
4. Added shambler arms reaching toward player
5. Improved stalker with elongated predator shape
6. Added stalker stealth shimmer effect when not chasing
7. Improved boss with armor plates and crown crests
8. Added boss glowing weak points (pulsing orange)
9. Added enemy outer glow for better visibility (GDD feedback)
10. Added enemy health bars for all enemies (not just damaged)
11. Added enemy name labels above health bars
12. Added glowing red eyes with shadow blur effect
13. Improved player sprite with space suit, helmet visor
14. Added player weapon visualization
15. Added flashlight beam effect
16. Improved door rendering with indicator lights
17. Added door prompt "[E] OPEN/CLOSE DOOR"
18. Improved escape pod with glowing cyan effect
19. Added room name labels (AWAKENING BAY, MEDICAL BAY, etc.)
20. Added corridor warning stripes

## Refine Passes (20 required)
1. Fixed vision cone to REVEAL things (not hide) - GDD critical fix
2. Increased base ambient brightness so room layouts visible
3. Matched floor tile colors to dark industrial theme
4. Added floor tile pattern with subtle grid lines
5. Matched wall stroke colors to industrial panels
6. Added minimap in top-right corner showing ship layout
7. Added minimap player position with vision cone indicator
8. Added minimap enemy dots (only when in vision cone)
9. Added minimap door indicators (green=open, red=closed)
10. Added minimap room type indicators (exit=cyan, life support=green)
11. Fixed collision detection to include corridors
12. Fixed raycast visibility to include corridors
13. Matched HUD layout: O2 bar, HP bar, weapon info
14. Added O2 warning overlay when below 20
15. Fixed item visibility in vision cone only
16. Fixed enemy visibility in vision cone only (GDD critical fix)
17. Added room exploration tracking
18. Fixed life support room O2 restoration
19. Matched controls to GDD: WASD move, mouse aim, LMB attack
20. Fixed space mode ship docking to progress to next ship

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Mouse aim toward cursor
- [x] 90-degree vision cone, 300px range
- [x] Vision cone REVEALS (not hides) - fixed per feedback
- [x] O2 constantly draining (idle/walk/run/combat rates)
- [x] O2 death at 0
- [x] HP system with damage
- [x] Invincibility frames after damage
- [x] 4 enemy types (Crawler, Shambler, Stalker, Ship Boss)
- [x] Enemy AI (patrol, chase, attack)
- [x] 4 weapons (Pipe, Pistol, Shotgun, SMG)
- [x] Melee and ranged combat
- [x] Room-based ship layout
- [x] Corridors connecting rooms
- [x] Door interaction (E key)
- [x] Item pickups (O2, medkits, weapons, ammo)
- [x] 3 ships with progression
- [x] Space mode (fly between ships)
- [x] Ship boss on final ship
- [x] Boss spawns adds at 50% HP
- [x] Escape pod victory condition
- [x] Life support rooms restore O2
- [x] Flashlight toggle (F key)
- [x] Reload mechanic (R key)
- [x] Minimap with fog of war
- [x] Debug overlay (Q key)
- [x] HUD with O2, HP, weapon info
- [x] Increased brightness (GDD feedback)
- [x] Enemies clearly visible (GDD feedback)
- [x] No combo system (removed per GDD feedback)
- [x] Spaceship phase between ships (GDD feedback)

## Post-Mortem
### What Went Well
- Vision cone creates good horror atmosphere when properly implemented
- Enemy designs are distinctive (spider crawler, shambler, stalker)
- O2 system creates constant tension
- Room-based exploration works well with corridors
- Minimap helps navigation without breaking immersion
- Space mode provides variety between ship explorations

### What Went Wrong
- Initial vision cone was inverted (made things invisible instead of visible)
- Initial brightness was too dark to see room layouts
- Enemies needed multiple iterations to be clearly visible
- Corridor collision detection needed separate implementation

### Time Spent
- Initial build: ~40 minutes
- Expand passes: ~45 minutes
- Polish passes: ~35 minutes
- Refine passes: ~30 minutes
- Total: ~150 minutes
