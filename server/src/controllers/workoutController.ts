import { Response } from 'express';
import { ExtendedRequest } from '../middleware/authMiddleware'; // Import ExtendedRequest
import Workout, { IWorkout } from '../models/Workout';
import User from '../models/User'; // Import User model
import { addPointsAndLevelUp, updateUserStreak } from '../services/gamificationService'; // Import updateUserStreak
import { POINTS_PER_WORKOUT } from '../config/gamificationConstants';

/**
 * @route   POST /api/workouts
 * @desc    Create a new workout
 * @access  Private (to be implemented with auth middleware)
 */
export const createWorkout = async (req: ExtendedRequest, res: Response) => {
  try {
    // userId will now come from req.user.id (set by 'protect' middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated for creating workout.' });
    }

    const {
      title,
      date,
      exercises,
      duration,
      notes,
      completed,
    } = req.body as Partial<Omit<IWorkout, 'userId'>>; // Omit userId as it's from token

    // Basic validation - Mongoose schema will do more thorough validation
    if (!title || !date || !exercises) {
      return res.status(400).json({
        message:
          'Missing required fields. Ensure title, date, and exercises are provided.',
      });
    }

    // Validate exercises structure minimally (Mongoose will handle deeper validation)
    if (!Array.isArray(exercises) || exercises.length === 0) {
        // Allow empty exercises array if that's a valid state, but usually a workout has exercises.
        // For this implementation, we'll require at least one exercise if the array is provided.
        // Or, if an empty exercises array is acceptable, this check could be modified or removed.
        // This example assumes exercises are expected.
    }

    const newWorkoutData = {
      userId,
      title,
      date: new Date(date), // Ensure date is a Date object
      exercises,
      duration,
      notes,
      completed: completed !== undefined ? completed : false, // Default to false if not provided
    };

    const workout = new Workout(newWorkoutData);
    await workout.save();

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        if (workout.completed) {
          user.workoutsCompleted = (user.workoutsCompleted || 0) + 1;
          try {
            await user.save(); // Save user with updated workoutsCompleted count FIRST
            console.log(`[WorkoutController] User ${user.email} workoutsCompleted updated to ${user.workoutsCompleted}.`);
          } catch (userSaveError) {
            console.error(`[WorkoutController] Error saving user after incrementing workoutsCompleted for ${userId} (createWorkout):`, userSaveError);
          }

          // Award points for completing the workout
          try {
            console.log(`[WorkoutController] Attempting to add ${POINTS_PER_WORKOUT} points to user ${userId} for completed workout.`);
            const updatedUserFromGamification = await addPointsAndLevelUp(userId, POINTS_PER_WORKOUT);
            if (updatedUserFromGamification) {
              console.log(`[WorkoutController] Gamification successful. User ${updatedUserFromGamification.email} now has ${updatedUserFromGamification.points} points and is level ${updatedUserFromGamification.level}.`);
            } else {
              console.error(`[WorkoutController] Gamification service did not return updated user for ${userId} after workout creation.`);
            }
          } catch (gamificationError) {
            console.error('[WorkoutController] Error calling addPointsAndLevelUp after workout creation:', gamificationError);
          }

          // Update user streak if workout was completed
          try {
            console.log(`[WorkoutController] Attempting to update streak for user ${userId} with activity date ${workout.date} (createWorkout).`);
            await updateUserStreak(userId, workout.date); // workout.date is already a Date object here
          } catch (streakError) {
            console.error('[WorkoutController] Error calling updateUserStreak after workout creation:', streakError);
          }
        }
      } else {
        console.warn(`[WorkoutController] User not found with ID ${userId} when trying to update workout stats, award points, or update streak.`);
      }
    }

    res.status(201).json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    // Check for Mongoose validation error
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
    }
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error creating workout', error: error.message });
    } else {
      res.status(500).json({ message: 'Server error creating workout' });
    }
  }
};

/**
 * @route   GET /api/workouts
 * @desc    Get all workouts for the logged-in user
 * @access  Private
 */
export const getWorkouts = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated for fetching workouts.' });
    }

    const workouts = await Workout.find({ userId }).sort({ date: -1 }); // Sort by date descending
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error fetching workouts', error: error.message });
    } else {
      res.status(500).json({ message: 'Server error fetching workouts' });
    }
  }
};

// Future methods (getWorkoutById, updateWorkout, deleteWorkout) can be added here

/**
 * @route   GET /api/workouts/:id
 * @desc    Get a single workout by ID
 * @access  Private
 */
export const getWorkoutById = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const workoutId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated for fetching workout.' });
    }

    const workout = await Workout.findOne({ _id: workoutId, userId });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found or user not authorized.' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout by ID:', error);
    if (error instanceof Error && error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID format.' });
    }
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error fetching workout', error: error.message });
    } else {
      res.status(500).json({ message: 'Server error fetching workout' });
    }
  }
};

/**
 * @route   PUT /api/workouts/:id
 * @desc    Update a workout
 * @access  Private
 */
export const updateWorkout = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const workoutId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated for updating workout.' });
    }

    const workout = await Workout.findById(workoutId);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found.' });
    }

    if (workout.userId.toString() !== userId) {
      return res.status(403).json({ message: 'User not authorized to update this workout.' });
    }

    const { title, date, exercises, duration, notes, completed } = req.body as Partial<IWorkout>;
    const wasCompleted = workout.completed;

    if (title !== undefined) workout.title = title;
    if (date !== undefined) workout.date = new Date(date);
    if (exercises !== undefined) workout.exercises = exercises;
    if (duration !== undefined) workout.duration = duration;
    if (notes !== undefined) workout.notes = notes;
    if (completed !== undefined) workout.completed = completed;

    const updatedWorkout = await workout.save();

    // Handle gamification and user stats if completion status actually changed
    if (userId && typeof completed === 'boolean' && completed !== wasCompleted) {
      const user = await User.findById(userId);
      if (user) {
        let callGamification = false;
        if (completed) {
          user.workoutsCompleted = (user.workoutsCompleted || 0) + 1;
          callGamification = true;
        } else {
          user.workoutsCompleted = Math.max(0, (user.workoutsCompleted || 0) - 1);
          // Optional: Deduct points if a workout is marked as uncompleted
          // console.log(`[WorkoutController] Workout marked uncompleted. Consider if points/level should be adjusted.`);
        }

        try {
          await user.save(); // Save user with updated workoutsCompleted count FIRST
          console.log(`[WorkoutController] User ${user.email} workoutsCompleted updated to ${user.workoutsCompleted} (updateWorkout).`);
        } catch (userSaveError) {
          console.error(`[WorkoutController] Error saving user after updating workoutsCompleted for ${userId} (updateWorkout):`, userSaveError);
        }

        if (callGamification) {
          // Award points for newly completed workout
          try {
            console.log(`[WorkoutController] Attempting to add ${POINTS_PER_WORKOUT} points to user ${userId} for newly completed workout (update).`);
            const updatedUserFromGamification = await addPointsAndLevelUp(userId, POINTS_PER_WORKOUT);
            if (updatedUserFromGamification) {
              console.log(`[WorkoutController] Gamification successful on update. User ${updatedUserFromGamification.email} now has ${updatedUserFromGamification.points} points and is level ${updatedUserFromGamification.level}.`);
            } else {
              console.error(`[WorkoutController] Gamification service did not return updated user for ${userId} after workout update (addPointsAndLevelUp).`);
            }
          } catch (gamificationError) {
            console.error('[WorkoutController] Error calling addPointsAndLevelUp during workout update:', gamificationError);
          }

          // Update user streak if workout was newly completed
          try {
            console.log(`[WorkoutController] Attempting to update streak for user ${userId} with activity date ${updatedWorkout.date} (updateWorkout).`);
            await updateUserStreak(userId, updatedWorkout.date);
          } catch (streakError) {
            console.error('[WorkoutController] Error calling updateUserStreak during workout update:', streakError);
          }
        } // End of if(callGamification)
      } else {
        console.warn(`[WorkoutController] User not found with ID ${userId} when trying to update workout stats during update.`);
      } // End of if(user)
    } // End of if (userId && typeof completed === 'boolean' && completed !== wasCompleted)

    res.json(updatedWorkout); // Send back the updated workout regardless of gamification outcome

  } catch (error) {
    console.error('Error updating workout:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
    }
    if (error instanceof Error && error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID format.' });
    }
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error updating workout', error: error.message });
    } else {
      res.status(500).json({ message: 'An unknown server error occurred while updating workout' });
    }
  }
};

/**
 * @route   DELETE /api/workouts/:id
 * @desc    Delete a workout
 * @access  Private
 */
export const deleteWorkout = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const workoutId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated for deleting workout.' });
    }

    const workout = await Workout.findOne({ _id: workoutId, userId });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found or user not authorized.' });
    }

    const wasCompleted = workout.completed;

    await Workout.findByIdAndDelete(workoutId);

    // If the deleted workout was completed, decrement the user's completed workouts count
    if (wasCompleted) {
      const user = await User.findById(userId);
      if (user) {
        user.workoutsCompleted = Math.max(0, (user.workoutsCompleted || 0) - 1);
        try {
          await user.save();
          console.log(`[WorkoutController] User ${user.email} workoutsCompleted decremented to ${user.workoutsCompleted} after workout deletion.`);
        } catch (userSaveError) {
          console.error(`[WorkoutController] Error saving user after decrementing workoutsCompleted for ${userId} (deleteWorkout):`, userSaveError);
          // Log error but continue, as workout deletion was primary goal
        }
      } else {
        console.warn(`[WorkoutController] User not found with ID ${userId} when trying to update workoutsCompleted after workout deletion.`);
      }
    }

    res.json({ message: 'Workout deleted successfully.' });

  } catch (error) {
    console.error('Error deleting workout:', error);
    if (error instanceof Error && error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid workout ID format.' });
    }
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error deleting workout', error: error.message });
    } else {
      res.status(500).json({ message: 'An unknown server error occurred while deleting workout' });
    }
  }
};
