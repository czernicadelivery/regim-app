// ============================================================================
// LOCK IN 2027 — js/core/gamification-engine.js
// Silnik obliczeniowy dla XP, poziomów i odznak.
// ============================================================================

export function calcLevel(xp) {
  if (xp <= 0) return 1;
  // Wymagania: Lvl 1 = 0 XP, Lvl 2 = 100 XP, Lvl 3 = 400 XP, Lvl 4 = 900 XP...
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level) {
  // Ile XP trzeba mieć, żeby osiągnąć dany poziom
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

export function xpProgress(xp) {
  const currentLevel = calcLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const needed = nextLevelXp - currentLevelXp;
  const gained = xp - currentLevelXp;
  const pct = Math.min(100, Math.max(0, Math.round((gained / needed) * 100)));
  
  return { currentLevel, currentLevelXp, nextLevelXp, needed, gained, pct };
}

// XP za różne aktywności (można modyfikować)
export const XP_RULES = {
  taskCompleted: 10,
  workoutCompleted: 50,
  perfectDayBonus: 30,
  streakMultiplier: 5
};

export function calculateDailyXp(completedTasks, totalTasks, streak) {
  let xp = 0;
  // XP za zadania
  xp += completedTasks * XP_RULES.taskCompleted;
  
  // Bonus za perfekcyjny dzień
  if (totalTasks > 0 && completedTasks === totalTasks) {
    xp += XP_RULES.perfectDayBonus;
  }
  
  // Bonus za streaka (mnożnik)
  if (streak > 0) {
    xp += (Math.min(streak, 10) * XP_RULES.streakMultiplier);
  }
  
  return xp;
}
