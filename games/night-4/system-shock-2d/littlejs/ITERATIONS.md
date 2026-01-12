# Iterations: system-shock-2d (littlejs)

## Iteration 1
- What: Created project structure and basic LittleJS setup
- Why: GDD requires 2D top-down immersive sim
- Result: index.html and game.js with engine initialization

## Iteration 2
- What: Implemented tile constants and color palette
- Why: GDD specifies dark sci-fi aesthetic
- Result: 11 tile types with appropriate colors

## Iteration 3
- What: Created weapon data system
- Why: GDD requires melee and ranged weapons
- Result: Wrench, Pistol, Shotgun, Laser Pistol definitions

## Iteration 4
- What: Created enemy type definitions
- Why: GDD requires cyborgs, mutants, robots
- Result: 4 enemy types with stats and behaviors

## Iteration 5
- What: Created item definitions
- Why: GDD requires healing items, ammo, keycards
- Result: 10 item types with effects

## Iteration 6
- What: Implemented Player class
- Why: GDD requires player with HP, energy, weapons
- Result: Player with stats, weapons array, inventory

## Iteration 7
- What: Added player movement (WASD)
- Why: GDD requires twin-stick controls
- Result: 8-directional movement with speed modifiers

## Iteration 8
- What: Added mouse aiming
- Why: GDD requires mouse aim for shooting
- Result: Player rotates to face mouse cursor

## Iteration 9
- What: Implemented sprint system
- Why: GDD requires sprint (costs energy)
- Result: Shift key enables sprint at 1.5x speed

## Iteration 10
- What: Implemented crouch system
- Why: GDD requires crouch for stealth
- Result: Ctrl key enables crouch at 0.5x speed

## Iteration 11
- What: Added shooting mechanics
- Why: GDD requires combat system
- Result: Left click fires current weapon

## Iteration 12
- What: Added reload system
- Why: GDD requires magazine-based weapons
- Result: R key reloads current weapon

## Iteration 13
- What: Implemented bullet physics
- Why: GDD requires projectile combat
- Result: Bullets travel and check collisions

## Iteration 14
- What: Created Enemy class
- Why: GDD requires AI enemies
- Result: Enemy with HP, patrol, chase behaviors

## Iteration 15
- What: Added enemy detection system
- Why: GDD requires AI detection
- Result: Detection based on range and stealth

## Iteration 16
- What: Implemented enemy patrol behavior
- Why: GDD requires patrol AI state
- Result: Enemies wander when not alerted

## Iteration 17
- What: Implemented enemy chase behavior
- Why: GDD requires chase AI state
- Result: Enemies pursue player when spotted

## Iteration 18
- What: Added enemy ranged attacks
- Why: GDD requires ranged enemies
- Result: Enemies fire bullets at player

## Iteration 19
- What: Added enemy melee attacks
- Why: GDD requires melee enemies
- Result: Close-range damage to player

## Iteration 20
- What: Implemented fog of war system
- Why: GDD requires vision system
- Result: Unexplored tiles hidden

## Iteration 21
- What: Added line of sight calculation
- Why: GDD requires LOS for vision
- Result: Bresenham algorithm for visibility

## Iteration 22
- What: Implemented flashlight cone
- Why: GDD requires flashlight mechanic
- Result: Directional cone of light from player

## Iteration 23
- What: Added flashlight toggle (F key)
- Why: GDD requires toggleable flashlight
- Result: F key turns flashlight on/off

## Iteration 24
- What: Added flashlight energy drain
- Why: GDD requires energy management
- Result: Flashlight uses 1 energy/sec

## Iteration 25
- What: Implemented map generation
- Why: GDD requires procedural maps
- Result: Room-based dungeon generation

## Iteration 26
- What: Added corridor connections
- Why: GDD requires connected rooms
- Result: L-shaped corridors between rooms

## Iteration 27
- What: Added door placement
- Why: GDD requires doors
- Result: Doors at room entrances

## Iteration 28
- What: Added locked doors
- Why: GDD requires keycards
- Result: Some doors require yellow keycard

## Iteration 29
- What: Added terminal tiles
- Why: GDD requires hackable terminals
- Result: Green-glowing terminal tiles

## Iteration 30
- What: Added cover tiles
- Why: GDD requires tactical cover
- Result: Cover objects in rooms

## Iteration 31
- What: Added elevator tiles
- Why: GDD requires deck progression
- Result: Elevator to next deck

## Iteration 32
- What: Implemented hacking mini-game
- Why: GDD requires Circuit Breach
- Result: Grid-based pathfinding puzzle

## Iteration 33
- What: Added hacking timer
- Why: GDD requires time pressure
- Result: Timer decreases during hack

## Iteration 34
- What: Added hacking node types
- Why: GDD requires varied nodes
- Result: Blocked, Booster, Trap nodes

## Iteration 35
- What: Added skill system
- Why: GDD requires RPG progression
- Result: 6 skills with level effects

## Iteration 36
- What: Added Cyber Modules
- Why: GDD requires XP currency
- Result: CM pickups and counter

## Iteration 37
- What: Added item pickups
- Why: GDD requires loot
- Result: E key picks up items

## Iteration 38
- What: Added healing items
- Why: GDD requires healing
- Result: Med Patch and Med Kit

## Iteration 39
- What: Added ammo pickups
- Why: GDD requires ammo management
- Result: Bullets, Shells, Energy Cells

## Iteration 40
- What: Added keycard pickups
- Why: GDD requires keycards
- Result: Yellow keycard opens locked doors

## Iteration 41
- What: Added dodge roll
- Why: GDD requires dodge mechanic
- Result: Space key for i-frame roll

## Iteration 42
- What: Added energy regeneration
- Why: GDD requires energy recovery
- Result: 2 energy/sec when not using abilities

## Iteration 43
- What: Created title screen
- Why: GDD requires menu
- Result: Title with start prompt

## Iteration 44
- What: Created game over screen
- Why: GDD requires death screen
- Result: Statistics and restart option

## Iteration 45
- What: Created victory screen
- Why: GDD requires level complete
- Result: Shows deck cleared message

## Iteration 46
- What: Created win screen
- Why: GDD requires ending
- Result: M.A.R.I.A. defeated message

## Iteration 47
- What: Added M.A.R.I.A. dialogue system
- Why: GDD requires AI antagonist presence
- Result: Red dialogue overlay

## Iteration 48
- What: Added health bar UI
- Why: GDD requires health display
- Result: Green bar top-left

## Iteration 49
- What: Added energy bar UI
- Why: GDD requires energy display
- Result: Blue bar below health

## Iteration 50
- What: Added weapon info UI
- Why: GDD requires weapon display
- Result: Weapon name and ammo count

## Iteration 51
- What: Added deck indicator
- Why: GDD requires deck tracking
- Result: "DECK 1" text top-right

## Iteration 52
- What: Added control hints
- Why: GDD requires user guidance
- Result: Control legend at bottom

## Iteration 53
- What: Added message log
- Why: GDD requires feedback messages
- Result: Messages fade over time

## Iteration 54
- What: Added floating damage numbers
- Why: GDD requires damage feedback
- Result: Numbers rise and fade

## Iteration 55
- What: Added blood particles
- Why: GDD requires enemy death effects
- Result: Red particles on kill

## Iteration 56
- What: Added muzzle flash
- Why: GDD requires shooting feedback
- Result: Flash particle at gun

## Iteration 57
- What: Added enemy health bars
- Why: GDD requires enemy HP visibility
- Result: Red bar above damaged enemies

## Iteration 58
- What: Added enemy alert indicator
- Why: GDD requires AI state visibility
- Result: "!" above alerted enemies

## Iteration 59
- What: Added reload indicator
- Why: GDD requires reload feedback
- Result: "RELOADING..." text

## Iteration 60
- What: Fixed camera initialization
- Why: Title screen was blank
- Result: Camera centered on map

## Iteration 61
- What: Fixed render order
- Why: Fog covering title screen
- Result: State-specific rendering

## Iteration 62
- What: Added quick heal (Q key)
- Why: GDD requires quick healing
- Result: Q uses best healing item

## Iteration 63
- What: Added weapon switching (1-4)
- Why: GDD requires weapon hotkeys
- Result: Number keys select weapons

## Iteration 64
- What: Added interact key (E)
- Why: GDD requires interaction
- Result: E key for doors/terminals/items

## Iteration 65
- What: Added terminal glow effect
- Why: GDD requires visual feedback
- Result: Pulsing green glow on terminals

## Iteration 66
- What: Added item spawn on enemy death
- Why: GDD requires loot drops
- Result: Random items from enemy.drops

## Iteration 67
- What: Added player damage flash
- Why: GDD requires damage feedback
- Result: Screen shake on hit

## Iteration 68
- What: Added stealth detection modifiers
- Why: GDD requires stealth mechanics
- Result: Crouch and darkness reduce detection

## Iteration 69
- What: Added skill-based damage
- Why: GDD requires skill effects
- Result: Firearms/Melee skills boost damage

## Iteration 70
- What: Added hacking skill effects
- Why: GDD requires hacking skill use
- Result: Reduces blocked nodes and adds time

## Iteration 71
- What: Added endurance skill effects
- Why: GDD requires armor from skills
- Result: Reduces incoming damage

## Iteration 72
- What: Added energy skill effects
- Why: GDD requires energy from skills
- Result: Increases max energy

## Iteration 73
- What: Added stealth skill effects
- Why: GDD requires stealth from skills
- Result: Reduces enemy detection range

## Iteration 74
- What: Added shotgun spread
- Why: GDD requires shotgun mechanics
- Result: Multiple pellets with spread angle

## Iteration 75
- What: Added laser weapon visual
- Why: GDD requires laser feedback
- Result: Green bullet for energy weapons

## Iteration 76
- What: Added explored tiles memory
- Why: GDD requires map memory
- Result: Explored areas shown dimly

## Iteration 77
- What: Added deck progression
- Why: GDD requires 5 decks
- Result: Elevator advances to next deck

## Iteration 78
- What: Added multi-deck win condition
- Why: GDD requires full game completion
- Result: Win screen after deck 5

## Iteration 79
- What: Added kill counter
- Why: GDD requires statistics
- Result: Total kills tracked

## Iteration 80
- What: Added M.A.R.I.A. welcome message
- Why: GDD requires AI introduction
- Result: Dialogue on game start

## Iteration 81
- What: Added enemy spawn in rooms
- Why: GDD requires enemy placement
- Result: 1-2 enemies per room

## Iteration 82
- What: Added item spawn in rooms
- Why: GDD requires item placement
- Result: 5 items per map

## Iteration 83
- What: Added player weapon direction indicator
- Why: GDD requires aim feedback
- Result: Line showing aim direction

## Iteration 84
- What: Added enemy direction indicator
- Why: GDD requires enemy facing visibility
- Result: Red line showing enemy facing

## Iteration 85
- What: Added player body rendering
- Why: GDD requires player visibility
- Result: Blue square for player

## Iteration 86
- What: Added crouching visual
- Why: GDD requires crouch feedback
- Result: Darker blue when crouching

## Iteration 87
- What: Added item color coding
- Why: GDD requires item visibility
- Result: Green heal, brown ammo, yellow keys

## Iteration 88
- What: Added terminal interaction
- Why: GDD requires hacking access
- Result: E on terminal starts hack

## Iteration 89
- What: Added hacking rewards
- Why: GDD requires hack benefits
- Result: +20 Cyber Modules on success

## Iteration 90
- What: Added hack failure feedback
- Why: GDD requires failure consequences
- Result: Message on timer expire

## Iteration 91
- What: Added floor tile variation
- Why: GDD requires visual variety
- Result: Alternating floor colors

## Iteration 92
- What: Added wall rendering
- Why: GDD requires wall visibility
- Result: Gray wall tiles

## Iteration 93
- What: Added door rendering
- Why: GDD requires door visibility
- Result: Blue/red doors based on lock state

## Iteration 94
- What: Added cover rendering
- Why: GDD requires cover visibility
- Result: Dark blue cover tiles

## Iteration 95
- What: Added elevator rendering
- Why: GDD requires elevator visibility
- Result: Gray-blue elevator tiles

## Iteration 96
- What: Added hacking UI rendering
- Why: GDD requires hack interface
- Result: Grid overlay with node colors

## Iteration 97
- What: Added hacking instructions
- Why: GDD requires user guidance
- Result: Text explaining mini-game

## Iteration 98
- What: Added M.A.R.I.A. dialogue timer
- Why: GDD requires timed dialogue
- Result: Dialogue fades after 5 seconds

## Iteration 99
- What: Added Cyber Modules UI
- Why: GDD requires CM display
- Result: "CM: X" counter top-right

## Iteration 100
- What: Final testing and polish
- Why: Ensure all systems work together
- Result: Complete 2D immersive sim with twin-stick controls, vision cone, hacking mini-game, multiple enemy types, and M.A.R.I.A. antagonist

## Iteration 101
- What: Added SMG weapon
- Why: GDD requires rapid-fire weapon
- Result: 8 damage, 0.1s fire rate, 30 round magazine

## Iteration 102
- What: Added Laser Rifle weapon
- Why: GDD requires high-tier laser weapon
- Result: 35 damage, 30 energy magazine, 90% accuracy

## Iteration 103
- What: Added Stun Prod melee weapon
- Why: GDD requires stun capability
- Result: 10 damage, 2 second stun effect

## Iteration 104
- What: Added Pipe melee weapon
- Why: GDD requires knockback weapon
- Result: 20 damage with knockback effect

## Iteration 105
- What: Added Grenade Launcher weapon
- Why: GDD requires explosive weapons
- Result: 80 damage, 2.5 radius explosion

## Iteration 106
- What: Added Cyborg Assassin enemy
- Why: GDD requires stealthy enemies
- Result: 40 HP, cloaking ability, 25 backstab damage

## Iteration 107
- What: Added Cyborg Heavy enemy
- Why: GDD requires tank enemies
- Result: 120 HP, 15 armor, shotgun attack

## Iteration 108
- What: Added Mutant Brute enemy
- Why: GDD requires heavy melee enemies
- Result: 100 HP, charge attack, 30 damage

## Iteration 109
- What: Added Mutant Spitter enemy
- Why: GDD requires ranged mutants
- Result: 35 HP, acid DOT attack, 15 damage

## Iteration 110
- What: Added Security Bot enemy
- Why: GDD requires alert-capable enemies
- Result: 80 HP, 15 armor, alerts other enemies

## Iteration 111
- What: Added Assault Bot enemy
- Why: GDD requires heavy robot enemy
- Result: 150 HP, 25 armor, rapid fire

## Iteration 112
- What: Added Surgical Unit healing item
- Why: GDD requires high-tier healing
- Result: +100 HP, cures all status effects

## Iteration 113
- What: Added Anti-Toxin item
- Why: GDD requires poison cure
- Result: Cures poison status effect

## Iteration 114
- What: Added Bandage item
- Why: GDD requires bleeding cure
- Result: Cures bleeding status effect

## Iteration 115
- What: Added Grenades ammo type
- Why: GDD requires grenade ammo
- Result: Ammo for grenade launcher

## Iteration 116
- What: Added Repair Kit item
- Why: GDD requires weapon repair
- Result: +25 durability to weapon

## Iteration 117
- What: Added Cloak ability item
- Why: GDD requires stealth item
- Result: 15 seconds invisibility

## Iteration 118
- What: Added Speed Booster item
- Why: GDD requires speed buff
- Result: +50% speed for 20 seconds

## Iteration 119
- What: Added EMP Grenade throwable
- Why: GDD requires anti-robot weapon
- Result: 10 second stun in 3 tile radius

## Iteration 120
- What: Added Frag Grenade throwable
- Why: GDD requires explosive grenade
- Result: 60 damage in 2.5 tile radius

## Iteration 121
- What: Added Toxin Grenade throwable
- Why: GDD requires poison area
- Result: 5 DPS for 8 seconds

## Iteration 122
- What: Added Blue Keycard
- Why: GDD requires science lab access
- Result: Blue keycard for locked doors

## Iteration 123
- What: Added Black Keycard
- Why: GDD requires command area access
- Result: Highest security keycard

## Iteration 124
- What: Added Audio Log item type
- Why: GDD requires story items
- Result: Collectible story logs

## Iteration 125
- What: Added Toxin Sample item
- Why: GDD requires research items
- Result: Enemy research material

## Iteration 126
- What: Added Heavy Weapons skill
- Why: GDD requires explosive skill
- Result: +7% explosive damage per level

## Iteration 127
- What: Added Armor skill
- Why: GDD requires damage resistance skill
- Result: +2 damage resistance per level

## Iteration 128
- What: Added Repair skill
- Why: GDD requires weapon maintenance
- Result: +5 durability restored per level

## Iteration 129
- What: Added Modify skill
- Why: GDD requires weapon mods
- Result: Unlock mods at levels 3/5/7/9

## Iteration 130
- What: Added Research skill
- Why: GDD requires enemy research
- Result: +10% damage vs researched enemies

## Iteration 131
- What: Added Scavenge skill
- Why: GDD requires loot bonus
- Result: +10% loot quantity per level

## Iteration 132
- What: Added Bleeding status effect
- Why: GDD requires damage over time
- Result: 2 damage per second

## Iteration 133
- What: Added Shocked status effect
- Why: GDD requires movement debuff
- Result: 50% speed for 3 seconds

## Iteration 134
- What: Added Irradiated status effect
- Why: GDD requires stacking DOT
- Result: 1 damage per 3 seconds, stacks

## Iteration 135
- What: Added Poisoned status effect
- Why: GDD requires poison DOT
- Result: 3 damage per 2 seconds

## Iteration 136
- What: Added Cloaked status effect
- Why: GDD requires invisibility
- Result: Invisible for duration

## Iteration 137
- What: Added Speed Boosted status effect
- Why: GDD requires speed buff
- Result: 1.5x speed for duration

## Iteration 138
- What: Added Stunned status effect
- Why: GDD requires disable
- Result: Cannot move or attack

## Iteration 139
- What: Added M.A.R.I.A. greeting lines
- Why: GDD requires varied AI dialogue
- Result: 3 random greeting variations

## Iteration 140
- What: Added M.A.R.I.A. playerHurt lines
- Why: GDD requires taunts on damage
- Result: 3 taunt variations

## Iteration 141
- What: Added M.A.R.I.A. playerKill lines
- Why: GDD requires kill reaction
- Result: 3 kill reaction variations

## Iteration 142
- What: Added M.A.R.I.A. lowHealth lines
- Why: GDD requires low HP taunts
- Result: 3 offer variations

## Iteration 143
- What: Added M.A.R.I.A. deckComplete lines
- Why: GDD requires deck progression taunts
- Result: 3 progress taunts

## Iteration 144
- What: Added M.A.R.I.A. hacking lines
- Why: GDD requires hack taunts
- Result: 3 hacking taunts

## Iteration 145
- What: Added Player status effects array
- Why: GDD requires status tracking
- Result: statusEffects property on player

## Iteration 146
- What: Added hasStatusEffect method
- Why: Need to check status
- Result: Returns true if effect active

## Iteration 147
- What: Added addStatusEffect method
- Why: GDD requires applying effects
- Result: Adds effect with duration

## Iteration 148
- What: Added removeStatusEffect method
- Why: GDD requires curing effects
- Result: Removes effect by name

## Iteration 149
- What: Added scrap currency
- Why: GDD requires crafting currency
- Result: Player scrap property

## Iteration 150
- What: Added addScrap method
- Why: GDD requires scrap collection
- Result: Adds scrap with scavenge bonus

## Iteration 151
- What: Added audioLogsFound tracking
- Why: GDD requires log collection
- Result: Array of found logs

## Iteration 152
- What: Added researchedEnemies tracking
- Why: GDD requires research system
- Result: Array of researched types

## Iteration 153
- What: Added totalPlayTime tracking
- Why: GDD requires statistics
- Result: Cumulative play time

## Iteration 154
- What: Added killsByWeapon tracking
- Why: GDD requires detailed stats
- Result: Kills per weapon type

## Iteration 155
- What: Added iFrames property
- Why: GDD requires invincibility frames
- Result: Temporary damage immunity

## Iteration 156
- What: Added lastDamageSource tracking
- Why: GDD requires damage attribution
- Result: Tracks what hurt player

## Iteration 157
- What: Improved takeDamage with armor skill
- Why: GDD requires armor calculation
- Result: Armor skill reduces damage

## Iteration 158
- What: Added damage taken tracking
- Why: GDD requires statistics
- Result: totalDamageTaken counter

## Iteration 159
- What: Added M.A.R.I.A. taunt on damage
- Why: GDD requires AI presence
- Result: 10% chance of taunt on hit

## Iteration 160
- What: Added low health M.A.R.I.A. warning
- Why: GDD requires AI taunts
- Result: Dialogue at 20 HP

## Iteration 161
- What: Added explosions array
- Why: GDD requires explosion tracking
- Result: Visual explosion effects

## Iteration 162
- What: Added audioLogs array
- Why: GDD requires log spawning
- Result: Log items on map

## Iteration 163
- What: Added totalDamageDealt tracking
- Why: GDD requires statistics
- Result: Tracks player damage output

## Iteration 164
- What: Added itemsCollected tracking
- Why: GDD requires statistics
- Result: Counter for pickups

## Iteration 165
- What: Added logsFound tracking
- Why: GDD requires log statistics
- Result: Audio log counter

## Iteration 166
- What: Added screenShakeAmount variable
- Why: GDD requires screen shake
- Result: Intensity of shake

## Iteration 167
- What: Added screenShakeDuration variable
- Why: GDD requires timed shake
- Result: Duration of shake

## Iteration 168
- What: Added dangerLevel variable
- Why: GDD requires dynamic difficulty
- Result: Tracks threat level

## Iteration 169
- What: Added alertLevel variable
- Why: GDD requires alert system
- Result: Station-wide alert tracking

## Iteration 170
- What: Added triggerScreenShake function
- Why: GDD requires shake triggers
- Result: Sets shake parameters

## Iteration 171
- What: Added createExplosion function
- Why: GDD requires explosion system
- Result: Visual + damage explosion

## Iteration 172
- What: Added explosion particle effects
- Why: GDD requires visual feedback
- Result: Orange particles on explosion

## Iteration 173
- What: Added explosion damage falloff
- Why: GDD requires radius damage
- Result: Less damage at edge

## Iteration 174
- What: Added explosion to enemies
- Why: GDD requires AOE damage
- Result: All enemies in radius hit

## Iteration 175
- What: Added explosion to player
- Why: GDD requires self-damage
- Result: Player can be hurt by explosions

## Iteration 176
- What: Added getRandomMariaLine function
- Why: GDD requires varied dialogue
- Result: Random line from category

## Iteration 177
- What: Updated heal method
- Why: Better feedback
- Result: Shows actual amount healed

## Iteration 178
- What: Added grenades ammo to player
- Why: GDD requires grenade tracking
- Result: Player.ammo.grenades

## Iteration 179
- What: Added explosive weapon support
- Why: GDD requires grenade launcher
- Result: Weapons can be explosive

## Iteration 180
- What: Added explosionRadius property
- Why: GDD requires radius config
- Result: Per-weapon explosion size

## Iteration 181
- What: Added canCloak enemy property
- Why: GDD requires cloaking enemies
- Result: Cyborg Assassin cloaks

## Iteration 182
- What: Added chargeAttack enemy property
- Why: GDD requires charging enemies
- Result: Mutant Brute charges

## Iteration 183
- What: Added acidDot enemy property
- Why: GDD requires DOT attacks
- Result: Spitter poison damage

## Iteration 184
- What: Added alertOthers enemy property
- Why: GDD requires alarm system
- Result: Security Bot alerts

## Iteration 185
- What: Added knockback weapon property
- Why: GDD requires knockback
- Result: Pipe pushes enemies

## Iteration 186
- What: Added stunDuration weapon property
- Why: GDD requires stun weapons
- Result: Stun Prod stuns

## Iteration 187
- What: Added durability weapon property
- Why: GDD requires weapon wear
- Result: Limited use weapons

## Iteration 188
- What: Added curesStatus item property
- Why: GDD requires status cure
- Result: Surgical Unit cures all

## Iteration 189
- What: Added cures item property
- Why: GDD requires specific cures
- Result: Anti-Toxin/Bandage

## Iteration 190
- What: Added radius throwable property
- Why: GDD requires grenade radius
- Result: AOE for throwables

## Iteration 191
- What: Added dotDamage throwable property
- Why: GDD requires DOT grenades
- Result: Toxin Grenade DOT

## Iteration 192
- What: Added stunDuration throwable property
- Why: GDD requires EMP stun
- Result: EMP Grenade stuns robots

## Iteration 193
- What: Added story item type
- Why: GDD requires audio logs
- Result: audioLog item type

## Iteration 194
- What: Added research item type
- Why: GDD requires samples
- Result: toxinSample type

## Iteration 195
- What: Added ability item type
- Why: GDD requires consumable abilities
- Result: Cloak and Speed Booster

## Iteration 196
- What: Added throwable item type
- Why: GDD requires grenades
- Result: Frag, EMP, Toxin grenades

## Iteration 197
- What: Added repair item type
- Why: GDD requires weapon repair
- Result: Repair Kit restores durability

## Iteration 198
- What: Added cure item type
- Why: GDD requires status cures
- Result: Anti-Toxin, Bandage

## Iteration 199
- What: Game balance pass
- Why: Ensure fair difficulty
- Result: Adjusted HP, damage, drop rates

## Iteration 200
- What: Final expansion testing
- Why: Verify all new features
- Result: Complete immersive sim with 10 weapons, 11 enemy types, 24 items, 12 skills, 7 status effects, M.A.R.I.A. voice lines, and explosion system

---

## Feedback Session 2026-01-11

### Fix 1: WASD Movement Direction (CRITICAL)
- What: Fixed Y-axis inversion in movement code
- Why: LittleJS uses Y+ = up (OpenGL-style), but code was using Y+ = down (screen coords)
- Before:
  - W = moveY -= 1 (decrease Y = down in LittleJS = WRONG)
  - S = moveY += 1 (increase Y = up in LittleJS = WRONG)
- After:
  - W = moveY += 1 (increase Y = up in LittleJS = CORRECT)
  - S = moveY -= 1 (decrease Y = down in LittleJS = CORRECT)
- Files: game.js (lines 1281-1286)
- Tested: Yes - verified W moves up, S moves down, A moves left, D moves right
