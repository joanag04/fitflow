import { Response } from 'express';
import User, { IUser } from '../models/User'; // Assuming IUser is exported from your User model
import { ExtendedRequest } from '../middleware/authMiddleware'; // For req.user

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getUserProfile = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch the user from the database, excluding the password hash
    // Select specific fields if you don't want to return the whole user object
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user profile data
    // You can customize what data is sent back, e.g., only relevant profile fields
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      height: user.height,
      weight: user.weight, // This can be used as currentWeight on the frontend
      goalWeight: user.goalWeight,
      // Add any other fields you want to expose on the profile
      currentStreak: user.currentStreak,
      points: user.points,
      level: user.level,
      nextLevelPoints: user.nextLevelPoints, // Added for progress bar accuracy
      workoutsCompleted: user.workoutsCompleted, // Added for display
      mealsTracked: user.mealsTracked, // Added for display
      lastActivityDate: user.lastActivityDate, // Added for completeness
      createdAt: user.createdAt
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error while fetching user profile', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateUserProfile = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields from req.body
    if (req.body.goalWeight !== undefined) {
      const newGoalWeight = parseFloat(req.body.goalWeight);
      if (isNaN(newGoalWeight) || newGoalWeight <= 0) {
        return res.status(400).json({ message: 'Invalid goal weight value.' });
      }
      user.goalWeight = newGoalWeight;
    }
    
    // Update current weight if provided
    if (req.body.weight !== undefined) {
      const newWeight = parseFloat(req.body.weight);
      if (isNaN(newWeight) || newWeight <= 0) {
        return res.status(400).json({ message: 'Invalid weight value.' });
      }
      user.weight = newWeight;
    }
    
    // Update other fields if needed
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.height !== undefined) {
      const newHeight = parseFloat(req.body.height);
      if (!isNaN(newHeight) && newHeight > 0) {
        user.height = newHeight;
      }
    }

    const updatedUser = await user.save();

    res.status(200).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      height: updatedUser.height,
      weight: updatedUser.weight, // current weight from profile
      goalWeight: updatedUser.goalWeight,
      // Include other fields as returned by getUserProfile for consistency
      currentStreak: updatedUser.currentStreak,
      points: updatedUser.points,
      level: updatedUser.level,
      nextLevelPoints: updatedUser.nextLevelPoints, // Added for consistency
      workoutsCompleted: updatedUser.workoutsCompleted, // Added for consistency
      mealsTracked: updatedUser.mealsTracked, // Added for consistency
      lastActivityDate: updatedUser.lastActivityDate, // Added for consistency
      createdAt: updatedUser.createdAt
    });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error updating profile', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating profile', error: error.message });
  }
};
