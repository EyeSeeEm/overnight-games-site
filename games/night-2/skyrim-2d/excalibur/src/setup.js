// Setup module - runs before main.js for testing
console.log('Frostfall setup loading');

// Game state for testing
window.gameState = {
  scene: 'menu',
  // Player stats
  health: 100,
  maxHealth: 100,
  magicka: 50,
  maxMagicka: 50,
  stamina: 100,
  maxStamina: 100,
  // Leveling
  level: 1,
  xp: { combat: 0, magic: 0, stealth: 0 },
  skills: { combat: 1, magic: 1, stealth: 1 },
  perkPoints: 0,
  perks: [],
  // Inventory
  gold: 50,
  inventory: [
    { id: 'health_potion', name: 'Health Potion', type: 'consumable', effect: { health: 50 } }
  ],
  equipment: {
    weapon: { id: 'iron_sword', name: 'Iron Sword', damage: 8, type: 'melee' },
    head: null,
    body: null,
    hands: null,
    feet: null,
    shield: null
  },
  // World
  currentZone: 'riverwood',
  questActive: null,
  questsCompleted: [],
  enemiesKilled: 0,
  lastUpdate: Date.now()
};

// Calculate player level from skills
function calculateLevel() {
  const skills = window.gameState.skills;
  return Math.floor((skills.combat + skills.magic + skills.stealth) / 3);
}

// Check for skill level up
function checkSkillLevelUp(skill) {
  const currentSkill = window.gameState.skills[skill];
  const currentXp = window.gameState.xp[skill];
  const xpNeeded = 100 * currentSkill;

  if (currentXp >= xpNeeded && currentSkill < 10) {
    window.gameState.skills[skill]++;
    window.gameState.xp[skill] = 0;

    // Check for character level up
    const newLevel = calculateLevel();
    if (newLevel > window.gameState.level) {
      window.gameState.level = newLevel;
      window.gameState.maxHealth += 10;
      window.gameState.health = window.gameState.maxHealth;
      window.gameState.maxMagicka += 5;
      window.gameState.magicka = window.gameState.maxMagicka;
      window.gameState.maxStamina += 5;
      window.gameState.stamina = window.gameState.maxStamina;
      window.gameState.perkPoints++;
      console.log('Level up!', newLevel);
    }
    return true;
  }
  return false;
}

// Testing helpers
window.startGame = () => {
  console.log('startGame called');
  window.gameState.scene = 'game';
  window.gameState.health = window.gameState.maxHealth;
  window.gameState.magicka = window.gameState.maxMagicka;
  window.gameState.stamina = window.gameState.maxStamina;
  window.gameState.lastUpdate = Date.now();

  // Start game loop for testing
  if (!window.gameState.loopRunning) {
    window.gameState.loopRunning = true;
    setInterval(() => {
      if (window.gameState.scene !== 'game') return;
      const now = Date.now();
      const delta = (now - window.gameState.lastUpdate) / 1000;
      window.gameState.lastUpdate = now;

      // Stamina regen
      if (window.gameState.stamina < window.gameState.maxStamina) {
        window.gameState.stamina = Math.min(
          window.gameState.maxStamina,
          window.gameState.stamina + 10 * delta
        );
      }
    }, 100);
  }
};

window.attack = () => {
  console.log('attack called');
  const weapon = window.gameState.equipment.weapon;
  if (!weapon) return 0;

  // Consume stamina
  if (window.gameState.stamina < 10) return 0;
  window.gameState.stamina -= 10;

  // Calculate damage
  const skillLevel = window.gameState.skills.combat;
  const skillMultiplier = 1.0 + (skillLevel * 0.05);
  const damage = Math.floor(weapon.damage * skillMultiplier);

  // Gain combat XP
  window.gameState.xp.combat += damage;
  checkSkillLevelUp('combat');

  return damage;
};

window.killEnemy = (xpGain = 50) => {
  console.log('Enemy killed, XP:', xpGain);
  window.gameState.enemiesKilled++;
  window.gameState.xp.combat += xpGain;
  checkSkillLevelUp('combat');
};

window.takeDamage = (amount) => {
  window.gameState.health -= amount;
  if (window.gameState.health <= 0) {
    window.gameState.health = 0;
    window.gameState.scene = 'defeat';
  }
};

window.useItem = (itemIndex) => {
  const item = window.gameState.inventory[itemIndex];
  if (!item) return false;

  if (item.type === 'consumable' && item.effect) {
    if (item.effect.health) {
      window.gameState.health = Math.min(
        window.gameState.maxHealth,
        window.gameState.health + item.effect.health
      );
    }
    if (item.effect.magicka) {
      window.gameState.magicka = Math.min(
        window.gameState.maxMagicka,
        window.gameState.magicka + item.effect.magicka
      );
    }
    if (item.effect.stamina) {
      window.gameState.stamina = Math.min(
        window.gameState.maxStamina,
        window.gameState.stamina + item.effect.stamina
      );
    }
    // Remove item
    window.gameState.inventory.splice(itemIndex, 1);
    return true;
  }
  return false;
};

window.equipWeapon = (weaponData) => {
  window.gameState.equipment.weapon = weaponData;
};

window.addItem = (item) => {
  window.gameState.inventory.push(item);
};

window.addGold = (amount) => {
  window.gameState.gold += amount;
};

window.changeZone = (zone) => {
  window.gameState.currentZone = zone;
  console.log('Zone changed to:', zone);
};

window.startQuest = (questId) => {
  window.gameState.questActive = questId;
};

window.completeQuest = () => {
  if (window.gameState.questActive) {
    window.gameState.questsCompleted.push(window.gameState.questActive);
    window.gameState.questActive = null;
    window.gameState.gold += 100;
    return true;
  }
  return false;
};

window.triggerVictory = () => {
  window.gameState.scene = 'victory';
};

console.log('Frostfall setup complete');
