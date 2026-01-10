# Iteration Log: Tower Wizard Clone (Canvas)

## Reference Analysis
- Main colors: Dark purple/blue background, pink/salmon tower, soft pastels
- Art style: Cozy incremental/idle game aesthetic
- UI elements: Resource panel top-left, action panel right side, room tabs at bottom
- Core features from GDD:
  - Click orb for magic
  - Summon spirits
  - Tower ascension (11 levels)
  - Multiple room types with different mechanics
  - Prestige system with blessings
  - Totem/Dragon/Rune/Wall systems

## 20 EXPAND PASSES

### Expand 1: Full Resource System
- 8 resource types: magic, knowledge, wood, research, dragonXP, arcaneGold, runePoints, cosmicDust
- Lifetime tracking for magic and prestige

### Expand 2: 9 Spirit Types
- Cloudlings (magic), Spirit Tomes (knowledge), Druids (wood)
- Sages (research), Keepers (dragonXP), Alchemists (arcaneGold)
- Shamans (wall DPS), Ifrits (wall DPS), Runesmiths (runePoints)

### Expand 3: 11 Ascension Levels
- Exponential cost scaling: 100, 1000, 10000, 50K, 200K, 1M, 5M, 25M, 100M, 500M
- Magic per click scales with tower level

### Expand 4: Prestige System
- Prestige points calculated from lifetime magic
- Resets magic/spirits/assignments on prestige

### Expand 5: 7 Blessings
- Magic, Knowledge, Forest, Research, Dragon, Alchemy, Doubling
- Varying prestige point costs

### Expand 6: Totem System
- 3 totem types: magic, knowledge, forest
- Totem pairing bonuses

### Expand 7: Dragon System
- Dragon XP and leveling
- Dragon abilities unlock at levels 5, 10, 20

### Expand 8: Wall Combat System
- 5 walls: Stone, Iron, Crystal, Cloud, Void
- Increasing health: 10K, 100K, 1M, 10M, 100M
- Room unlocks as rewards

### Expand 9: Rune Crafting
- 4 rune types: Ember, Storm, Stone, Infinity
- Rune point costs and production bonuses

### Expand 10: 9 Navigable Rooms
- Orb, Study, Forest, Prestige, Academy, Dragon, Alchemy, Sorcery, Runes
- Each with unique mechanics and spirits

### Expand 11: Upgrade System
- Per-room upgrades: wizardMagic, tomeEfficiency, forestry, etc.
- Knowledge-based upgrade costs

### Expand 12: Relic System
- Mana Stone (magic boost)
- Holy Grail (all boost)
- Ouroboros (damage boost)

### Expand 13: Resource Multipliers
- Blessings multiply production
- Totems add percentage bonuses
- Relics apply multiplicative effects

### Expand 14: Spirit Assignment UI
- Assign/Remove buttons per room
- Visual count of assigned spirits

### Expand 15: Tower Level Display
- Shows current level and next cost
- Ascend button with requirement check

### Expand 16: Production Rate Display
- Shows magic/sec, knowledge/sec, etc.
- Updates dynamically based on assignments

### Expand 17: Wall DPS Display
- Shows current DPS from Sorcery spirits
- Wall health bar and progress

### Expand 18: Dragon Level Display
- Shows dragon XP progress
- Lists unlocked abilities

### Expand 19: Prestige Preview
- Shows expected prestige points
- Lists available blessings

### Expand 20: Number Formatting
- Formats numbers to K, M, B, T suffixes
- Handles very large incremental numbers

## 20 POLISH PASSES

### Polish 1: Star Field Background
- Twinkling animated stars
- Multiple brightness levels

### Polish 2: Mountain Silhouettes
- Three-layer parallax mountains
- Dark purple gradient

### Polish 3: Enhanced Particle System
- Magic particles on orb click
- Rise and fade animation

### Polish 4: Screen Shake
- Triggers on ascension
- Triggers on wall break

### Polish 5: Glowing Spirits
- Outer glow halo on floating spirits
- Pulsing animation

### Polish 6: Tower Shadow
- Ellipse shadow beneath tower
- Soft transparency

### Polish 7: Window Glow Animation
- Tower windows pulse gently
- Different phases per level

### Polish 8: Roof Ornament
- Pink orb on tower roof tip
- Matching game theme

### Polish 9: Enhanced Orb Glow
- Multi-layer radial gradient
- Hot pink glow effect

### Polish 10: Animated Orb Stars
- 8 orbiting star particles
- Sinusoidal orbit variation

### Polish 11: Notification System
- Popup messages for events
- Fade-out animation

### Polish 12: Damage Numbers
- Floating numbers in Sorcery room
- Yellow text with fade

### Polish 13: Panel Styling
- Dark translucent backgrounds
- Pink/salmon border colors

### Polish 14: Button Hover States
- Lighter fill on hover
- Visual feedback

### Polish 15: Room Tab Highlighting
- Selected tab has distinct color
- Clear navigation feedback

### Polish 16: Forest Trees
- Pink stylized trees at tower base
- Multiple sizes and spacing

### Polish 17: Spirit Bob Animation
- Floating spirits bob up/down
- Sinusoidal movement

### Polish 18: Resource Icons
- Color-coded resource dots
- Matches resource type theme

### Polish 19: Orb Click Text
- Shows magic per click above orb
- Instruction text below

### Polish 20: Smooth Idle Updates
- 60fps game loop
- Delta-time based production

## Feature Verification
- [x] Orb clicking for magic
- [x] Spirit summoning with scaling costs
- [x] 9 spirit types with unique production
- [x] 11 tower ascension levels
- [x] 9 navigable room types
- [x] Prestige system with reset
- [x] 7 blessings with costs
- [x] Totem system
- [x] Dragon XP and leveling
- [x] Wall combat with DPS
- [x] Rune crafting system
- [x] Relic system
- [x] Resource multipliers
- [x] Number formatting (K/M/B/T)
- [x] Star field background
- [x] Particle effects
- [x] Screen shake effects

## Final Comparison
Game achieves cozy incremental/idle aesthetic:
- Dark purple night sky with twinkling stars
- Pink/salmon tower with multiple floors
- Soft pastel color palette throughout
- Clean panel UI with room navigation
- Multiple progression systems (spirits, tower, prestige, walls)
- Satisfying click feedback with particles

## Post-Mortem

### What Went Well
- Incremental game loop is simple to implement (just resource += rate * dt)
- Multiple progression systems create engaging "one more thing" feeling
- Soft pastel colors create cozy, non-stressful atmosphere
- Room navigation tabs work well for organizing complex systems
- Number formatting (K/M/B/T) essential for incremental games

### What Went Wrong
- Click detection needed precise orb bounds calculation
- Balancing 8 resource types took iteration
- Prestige system reset logic was tricky to get right
- Too many systems can overwhelm new players

### Key Learnings
- Incremental games need exponential scaling to stay interesting
- Visual feedback on clicks is crucial (particles, numbers)
- Prestige mechanics should provide meaningful permanent upgrades
- Room-based navigation helps organize complex idle games

### Time Spent
- Initial build: ~20 minutes
- Expand passes: ~45 minutes
- Polish passes: ~25 minutes
- Total: ~90 minutes

### Difficulty Rating
Easy-Medium - Incremental mechanics are straightforward, but balancing multiple interconnected systems (spirits, resources, prestige, walls) requires careful thought about progression curves.
