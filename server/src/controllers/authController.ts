import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// !! IMPORTANT: Move this to an environment variable (e.g., .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Token expires in 1 day

// Helper function to generate JWT
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide name, email, and password.' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    // Create user - password will be hashed by pre-save hook in User model
    const newUser = new User({
      name,
      email,
      passwordHash: password, // Assign plain password here; model will hash it
    });

    await newUser.save();

    // Exclude passwordHash from the response
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
      message: 'User registered successfully.',
      user: userResponse,
      token: generateToken(newUser._id.toString()),
    });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({ message: 'Validation Error', errors: (error as any).errors });
    } else {
        res.status(500).json({ message: 'Server error during registration.' });
    }
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password.' });
      return;
    }

    // Need to explicitly select passwordHash as it's select: false in the schema
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials. User not found.' });
      return;
    }
    
    // user.passwordHash will be undefined if .select('+passwordHash') is not used
    if (!user.passwordHash) {
        res.status(500).json({ message: 'Error retrieving user credentials.' });
        return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
      return;
    }

    // Exclude passwordHash from the response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(200).json({
      message: 'Login successful.',
      user: userResponse,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
