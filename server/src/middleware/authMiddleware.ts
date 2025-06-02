import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User'; // Assuming IUser is exported from User model // Assuming User model exists for fetching user details

// Extend Express Request type to include user property
export interface ExtendedRequest extends Request {
  user?: { id: string; [key: string]: any }; // Add more user properties if needed
}

const JWT_SECRET = 'your-very-secure-and-long-jwt-secret-key'; // Hardcoded as per project decision

export const protect = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      console.log('[AuthMiddleware] Token received:', token);
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; [key: string]: any };
      console.log('[AuthMiddleware] Token decoded:', decoded);

      // Get user from the token (select -password to exclude password hash)
      // Ensure your User model exists and can be queried by _id
      const user: IUser | null = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      console.log('[AuthMiddleware] User found:', user ? { id: user.id, email: user.email } : null);
      req.user = { id: user.id, email: user.email }; // Attach user id (string virtual) and other relevant info
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
