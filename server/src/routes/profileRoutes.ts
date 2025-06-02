import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', protect, getUserProfile);

// @route   PUT api/profile
// @desc    Update current user's profile
// @access  Private
router.put('/', protect, updateUserProfile);

export default router;
