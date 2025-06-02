import { Request, Response } from 'express';
import Nutrition, { INutrition } from '../models/Nutrition';
import User, { IUser } from '../models/User'; // To verify user exists
import { addPointsAndLevelUp, updateUserStreak } from '../services/gamificationService';
import { POINTS_PER_MEAL_LOG } from '../config/gamificationConstants';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: { id: string }; // Assuming auth middleware adds user to request
}

// @desc    Add a nutrition log for the logged-in user for a specific date
// @route   POST /api/nutrition
// @access  Private
export const addNutritionLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { date, meals, waterIntake, notes } = req.body;

    if (!date || !meals) {
      return res.status(400).json({ message: 'Date and meals are required.' });
    }

    // Validate date format (optional, Mongoose will also try to cast)
    const logDate = new Date(date);
    if (isNaN(logDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format.' });
    }
    
    // Check if a log for this user and date already exists to prevent duplicates via this route
    // Updates should go through a PUT route
    const existingLog = await Nutrition.findOne({ userId, date: logDate });
    if (existingLog) {
      return res.status(400).json({ 
        message: 'Nutrition log for this date already exists. Use update to modify.',
        logId: existingLog._id 
      });
    }

    const newNutritionLog = new Nutrition({
      userId,
      date: logDate,
      meals,
      waterIntake,
      notes,
      // Totals will be calculated by the pre-save hook in Nutrition.ts
    });

    await newNutritionLog.save();

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.mealsTracked = (user.mealsTracked || 0) + 1;
        try {
          await user.save(); // Save user with updated mealsTracked count FIRST
          console.log(`[NutritionController] User ${user.email} mealsTracked updated to ${user.mealsTracked}.`);
        } catch (userSaveError) {
          console.error(`[NutritionController] Error saving user after incrementing mealsTracked for ${userId}:`, userSaveError);
          // Decide if we should proceed to award points if this save fails. For now, we will.
        }

        // Award points for logging a meal
        try {
          console.log(`[NutritionController] Attempting to add ${POINTS_PER_MEAL_LOG} points to user ${userId} for meal log.`);
          const updatedUserFromGamification = await addPointsAndLevelUp(userId, POINTS_PER_MEAL_LOG);
          if (updatedUserFromGamification) {
            console.log(`[NutritionController] Gamification successful. User ${updatedUserFromGamification.email} now has ${updatedUserFromGamification.points} points and is level ${updatedUserFromGamification.level}.`);
          } else {
            console.error(`[NutritionController] Gamification service did not return an updated user for ${userId} after meal log creation.`);
          }
        } catch (gamificationError) {
          console.error('[NutritionController] Error calling addPointsAndLevelUp after meal log creation:', gamificationError);
        }

        // Update user streak
        try {
          console.log(`[NutritionController] Attempting to update streak for user ${userId} with activity date ${logDate}.`);
          await updateUserStreak(userId, logDate);
        } catch (streakError) {
          console.error('[NutritionController] Error calling updateUserStreak after meal log creation:', streakError);
        }

      } else {
        console.warn(`[NutritionController] User not found with ID ${userId} when trying to update meal stats, award points, or update streak.`);
      }
    }

    res.status(201).json(newNutritionLog);

  } catch (error) {
    console.error('Error adding nutrition log:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while adding nutrition log.' });
  }
};

// @desc    Get nutrition log for the logged-in user for a specific date
// @route   GET /api/nutrition/:date (e.g., /api/nutrition/2023-10-27)
// @access  Private
export const getNutritionLogByDate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { date } = req.params;
    if (!date) {
        return res.status(400).json({ message: 'Date parameter is required.' });
    }

    // Ensure date is correctly interpreted (e.g., 'YYYY-MM-DD' should cover the whole day)
    const startDate = new Date(date); // Assumes date is YYYY-MM-DD
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format in parameter.' });
    }

    const nutritionLog = await Nutrition.findOne({ 
      userId, 
      date: { $gte: startDate, $lte: endDate } 
    });

    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found for this date.' });
    }

    res.status(200).json(nutritionLog);

  } catch (error) {
    console.error('Error fetching nutrition log by date:', error);
    res.status(500).json({ message: 'Server error while fetching nutrition log.' });
  }
};

// @desc    Get a specific meal from a nutrition log
// @route   GET /api/nutrition/:logId/meals/:mealId
// @access  Private
export const getMealDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { logId, mealId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!logId || !mealId) {
      return res.status(400).json({ message: 'Log ID and Meal ID are required.' });
    }

    // Find the nutrition log by ID and verify it belongs to the user
    const nutritionLog = await Nutrition.findOne({ 
      _id: logId,
      userId 
    });

    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found or access denied.' });
    }

    // Find the meal by ID in the meals array
    const meal = nutritionLog.meals.id(mealId);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found in the specified log.' });
    }

    // Calculate totals for the meal
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meal.foodItems.forEach(item => {
      totalCalories += (item.calories || 0) * (item.quantity || 0);
      totalProtein += (item.protein || 0) * (item.quantity || 0);
      totalCarbs += (item.carbs || 0) * (item.quantity || 0);
      totalFat += (item.fat || 0) * (item.quantity || 0);
    });

    // Create a response object with the meal and its calculated totals
    const response = {
      ...meal.toObject(),
      totals: {
        calories: parseFloat(totalCalories.toFixed(2)),
        protein: parseFloat(totalProtein.toFixed(2)),
        carbs: parseFloat(totalCarbs.toFixed(2)),
        fat: parseFloat(totalFat.toFixed(2))
      },
      logDate: nutritionLog.date
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching meal details:', error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid log ID or meal ID format.' });
    }
    res.status(500).json({ message: 'Server error while fetching meal details.' });
  }
};

// @desc    Get a specific nutrition log by ID
// @route   GET /api/nutrition/logs/:logId
// @access  Private
export const getNutritionLogById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { logId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: 'Invalid log ID format' });
    }

    const nutritionLog = await Nutrition.findOne({
      _id: logId,
      userId: userId
    });

    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }

    res.json(nutritionLog);
  } catch (error) {
    console.error('Error fetching nutrition log by ID:', error);
    res.status(500).json({ message: 'Server error while fetching nutrition log' });
  }
};

// @desc    Update an existing nutrition log
// @route   PUT /api/nutrition/logs/:logId
// @access  Private
export const updateNutritionLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { logId } = req.params;
    const { meals, waterIntake, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: 'Invalid log ID' });
    }

    // Find the existing log
    const existingLog = await Nutrition.findOne({ _id: logId, userId });
    if (!existingLog) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }

    // Update the log fields
    if (meals) existingLog.meals = meals;
    if (waterIntake !== undefined) existingLog.waterIntake = waterIntake;
    if (notes !== undefined) existingLog.notes = notes;

    // The pre-save hook will recalculate the totals
    const updatedLog = await existingLog.save();

    res.status(200).json(updatedLog);
  } catch (error) {
    console.error('Error updating nutrition log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a nutrition log
// @route   DELETE /api/nutrition/logs/:logId
// @access  Private
export const deleteNutritionLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { logId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: 'Invalid log ID' });
    }

    const result = await Nutrition.deleteOne({ _id: logId, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }

    res.status(200).json({ message: 'Nutrition log deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// TODO: Implement getNutritionLogs (GET /api/nutrition - with pagination/date range for history)
