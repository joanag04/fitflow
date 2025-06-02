import express from 'express';
import { createWorkout, getWorkouts, updateWorkout, deleteWorkout, getWorkoutById } from '../controllers/workoutController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   POST /api/workouts
// @desc    Create a new workout
// @access  Private (once authMiddleware is implemented)
router.post('/', protect, createWorkout);

// @route   GET /api/workouts
// @desc    Get all workouts for the logged-in user
// @access  Private
router.get('/', protect, getWorkouts);

// @route   PUT /api/workouts/:id
// @desc    Update a workout
// @access  Private
router.put('/:id', protect, updateWorkout); // Route to update a workout by ID
router.delete('/:id', protect, deleteWorkout); // Route to delete a workout by ID

// @route   GET /api/workouts/:id
// @desc    Get a single workout by ID
// @access  Private
router.get('/:id', protect, getWorkoutById);

// Future routes can be added here

export default router;
