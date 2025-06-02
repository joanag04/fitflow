export const POINTS_PER_WORKOUT = 50;
export const POINTS_PER_MEAL_LOG = 30;

export interface LevelThreshold {
  level: number;
  pointsNeeded: number; // Total points to reach this level
  title: string; // Optional: A title for the level, e.g., "Fitness Novice"
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, pointsNeeded: 0, title: 'Fitness Starter' },
  { level: 2, pointsNeeded: 100, title: 'Rising Challenger' },
  { level: 3, pointsNeeded: 250, title: 'Active Achiever' },
  { level: 4, pointsNeeded: 500, title: 'Dedicated Dynamo' },
  { level: 5, pointsNeeded: 800, title: 'Fitness Fanatic' },
  { level: 6, pointsNeeded: 1200, title: 'Elite Athlete' },
  // Add more levels as needed
];

/**
 * Gets the next level's threshold based on the current level.
 * If the current level is the max level, it returns the current level's threshold.
 */
export const getNextLevelThreshold = (currentLevel: number): LevelThreshold => {
  const nextLevel = LEVEL_THRESHOLDS.find(lt => lt.level === currentLevel + 1);
  return nextLevel || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]; // Return last level if no next level
};

/**
 * Gets the threshold for a specific level.
 */
export const getThresholdForLevel = (level: number): LevelThreshold | undefined => {
  return LEVEL_THRESHOLDS.find(lt => lt.level === level);
};
