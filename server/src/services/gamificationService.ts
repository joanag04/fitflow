import User, { IUser } from '../models/User';
import {
  LEVEL_THRESHOLDS,
  getNextLevelThreshold,
  getThresholdForLevel,
  POINTS_PER_MEAL_LOG,
  POINTS_PER_WORKOUT
} from '../config/gamificationConstants';

// Helper to normalize a date to midnight (start of the day)
const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Adds points to a user and handles level-ups.
 * @param userId The ID of the user.
 * @param pointsToAdd The number of points to add.
 * @returns The updated user document or null if user not found.
 */
export const addPointsAndLevelUp = async (userId: string, pointsToAdd: number): Promise<IUser | null> => {
  const user = await User.findById(userId);
  if (!user) {
    console.error(`[GamificationService] User not found with ID: ${userId}`);
    return null;
  }

  user.points += pointsToAdd;
  console.log(`[GamificationService] Added ${pointsToAdd} points to user ${user.email}. New total: ${user.points}`);

  let hasLeveledUp = false;
  let currentLevelThreshold = getThresholdForLevel(user.level);
  let nextLevelDetails = getNextLevelThreshold(user.level);

  // Check for level up
  // Loop in case of multiple level-ups from a single point addition
  while (currentLevelThreshold && user.points >= nextLevelDetails.pointsNeeded && user.level < LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length -1].level) {
    user.level += 1;
    hasLeveledUp = true;
    currentLevelThreshold = getThresholdForLevel(user.level);
    nextLevelDetails = getNextLevelThreshold(user.level);
    console.log(`[GamificationService] User ${user.email} leveled up to Level ${user.level}!`);
  }

  user.nextLevelPoints = nextLevelDetails.pointsNeeded;

  // If the user is at the max level, nextLevelPoints might reflect the current level's pointsNeeded
  // or a conceptual 'max points' if you define one beyond the last threshold.
  // For simplicity, if they are at max level, nextLevelPoints will be the points needed for that max level.
  if (user.level === LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level) {
      const maxLevelThreshold = getThresholdForLevel(user.level);
      if (maxLevelThreshold) {
          user.nextLevelPoints = maxLevelThreshold.pointsNeeded; 
      }
  }


  if (hasLeveledUp) {
    // Future: Send a notification to the user about their level up.
    console.log(`[GamificationService] User ${user.email} is now Level ${user.level}. Points for next level (${nextLevelDetails.level}): ${user.nextLevelPoints}`);
  }

  try {
    await user.save();
    console.log(`[GamificationService] User ${user.email} saved. Points: ${user.points}, Level: ${user.level}, NextLevelPoints: ${user.nextLevelPoints}`);
    return user;
  } catch (error) {
    console.error(`[GamificationService] Error saving user ${user.email}:`, error);
    // Potentially revert points/level if save fails, or handle more gracefully
    return null; // Or throw error
  }
};

/**
 * Updates the user's activity streak based on the date of the current activity.
 * @param userId The ID of the user.
 * @param activityDate The date of the activity (e.g., meal logged, workout completed).
 * @returns The updated user document or null if an error occurred.
 */
export const updateUserStreak = async (userId: string, activityDateInput: Date): Promise<IUser | null> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[GamificationService] User not found with ID ${userId} for streak update.`);
      return null;
    }

    const activityDate = normalizeDate(activityDateInput);
    const lastActivityDate = user.lastActivityDate ? normalizeDate(user.lastActivityDate) : null;

    if (lastActivityDate) {
      const diffTime = activityDate.getTime() - lastActivityDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Activity on consecutive day
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else if (diffDays > 1) {
        // Gap in activity, reset streak
        user.currentStreak = 1;
        user.streakStartDate = activityDate; // Reset streak start date
      } else if (diffDays === 0) {
        // Activity on the same day, streak maintained, no change to count unless it's the first activity
        if (user.currentStreak === 0) {
           user.currentStreak = 1;
           user.streakStartDate = activityDate;
        }
      } else {
        // activityDate is before lastActivityDate - this shouldn't normally happen if activities are logged chronologically.
        // Or, it's a very old activity. For simplicity, we can choose to reset or maintain.
        // Resetting might be safer if old activities can be logged.
        console.warn(`[GamificationService] Activity date (${activityDate.toDateString()}) is before or same as last recorded activity date (${lastActivityDate.toDateString()}). Streak logic might need review for this case. For now, resetting if new date is not same or consecutive.`);
        // if diffDays < 0, it means activityDate is in the past relative to lastActivityDate, this is odd.
        // For now, if not same day or next day, it resets. This covers diffDays < 0 too.
        user.currentStreak = 1;
        user.streakStartDate = activityDate;
      }
    } else {
      // No previous activity, start new streak
      user.currentStreak = 1;
      user.streakStartDate = activityDate;
    }

    user.lastActivityDate = activityDate; // Always update to the current activity's date

    await user.save();
    console.log(`[GamificationService] Streak updated for user ${user.email}. Current streak: ${user.currentStreak}, Last activity: ${user.lastActivityDate.toDateString()}`);
    return user;
  } catch (error) {
    console.error(`[GamificationService] Error updating streak for user ${userId}:`, error);
    return null;
  }
};
