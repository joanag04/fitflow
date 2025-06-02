import express from 'express';
import { 
  getWeightEntries, 
  logWeightEntry, 
  getGoalWeight, 
  setGoalWeight 
} from '../controllers/weightController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   GET api/weight
// @desc    Get all weight entries for the logged-in user
// @access  Private
router.get('/', protect, getWeightEntries);

// @route   POST api/weight
// @desc    Log a new weight entry for the logged-in user
// @access  Private
router.post('/', protect, logWeightEntry);

// @route   GET api/weight/goal
// @desc    Get the current goal weight for the logged-in user
// @access  Private
router.get('/goal', protect, getGoalWeight);

// @route   POST api/weight/goal
// @desc    Set or update the goal weight for the logged-in user
// @access  Private
router.post('/goal', protect, setGoalWeight);

export default router;
