import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  addNutritionLog, 
  getNutritionLogByDate, 
  getMealDetails, 
  getNutritionLogById, 
  updateNutritionLog,
  deleteNutritionLog 
} from '../controllers/nutritionController';
import User, { IUser } from '../models/User';
import mongoose, { Types } from 'mongoose'; // Import Types

const router = express.Router();

// Placeholder Authentication Middleware (should be in its own file: middleware/authMiddleware.ts)
interface AuthenticatedRequest extends Request {
  user?: { id: string }; // Define the user property
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-jwt-secret-key'; // Fallback to the known hardcoded secret

const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // Ensure decoded.id is treated as a string for findById, Mongoose can handle string representation of ObjectId
      const decodedPayload = jwt.verify(token, JWT_SECRET) as { id: string | Types.ObjectId }; 

      let userIdToFind: string | Types.ObjectId = decodedPayload.id;

      // Mongoose findById can accept a string, so this should be fine.
      const user: IUser | null = await User.findById(userIdToFind).select('-passwordHash'); 
      
      if (!user || !user._id) { // Also check if user._id exists
          return res.status(401).json({ message: 'Not authorized, user not found or user ID is missing' });
      }
      // user._id is of type Types.ObjectId (or similar from Mongoose)
      // We need to convert it to string for our req.user.id which we expect to be a string.
      req.user = { id: user._id.toString() }; 
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Not authorized, token invalid: ' + error.message });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
// End of Placeholder Authentication Middleware

// @route   POST /api/nutrition
// @desc    Add a nutrition log
// @access  Private
router.post('/', protect, addNutritionLog);

// @route   GET /api/nutrition/:date
// @desc    Get nutrition log by date for the logged-in user
// @access  Private
router.get('/:date', protect, getNutritionLogByDate);

// @route   GET /api/nutrition/logs/:logId
// @desc    Get a specific nutrition log by ID
// @access  Private
router.get('/logs/:logId', protect, getNutritionLogById);

// @route   PUT /api/nutrition/logs/:logId
// @desc    Update an existing nutrition log
// @access  Private
router.put('/logs/:logId', protect, updateNutritionLog);

// @route   DELETE /api/nutrition/logs/:logId
// @desc    Delete a nutrition log
// @access  Private
router.delete('/logs/:logId', protect, deleteNutritionLog);

// @route   GET /api/nutrition/:logId/meals/:mealId
// @desc    Get details of a specific meal from a nutrition log
// @access  Private
router.get('/:logId/meals/:mealId', protect, getMealDetails);

// TODO: Add routes for update and delete operations

export default router;
