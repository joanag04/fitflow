import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path'; // For resolving .env path if needed

// Environment variables are hardcoded for local development below.

// Import Mongoose connection function
import connectDB from './config/db';

// Initialize Express app
const app: Application = express();

// Global request logger (add this very early)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Server.ts] Incoming request: ${req.method} ${req.path}`);
  next();
});

// Connect to Database
connectDB();

// Middleware
// CORS - Cross-Origin Resource Sharing (Simplified for local development)
// This will allow all origins. For a more secure local setup, you might specify your client's origin e.g. http://localhost:5173
app.use(cors({ origin: '*', credentials: true })); 

// Example for specific origin:
// const localClientOrigin = 'http://localhost:5173'; // Assuming your React app runs on 5173
// app.use(cors({ origin: localClientOrigin, credentials: true }));

// !!! IMPORTANT: The JWT_SECRET constant below is defined in server.ts but currently NOT used by the actual authentication logic. !!!
// The active JWT secret is defined locally within 'authController.ts' and 'authMiddleware.ts'.
const JWT_SECRET_IN_SERVER_TS = 'your-very-secure-and-long-jwt-secret-key'; 
// This console.warn is informational about the constant in this file.
console.warn(`INFO: The JWT_SECRET_IN_SERVER_TS constant in server.ts is set to: "${JWT_SECRET_IN_SERVER_TS}". Note that the actual JWT secret used for token signing and verification is hardcoded within authController.ts and authMiddleware.ts.`);
// Make JWT_SECRET available to other modules if needed (e.g., by exporting or passing to them)
// For now, it's just declared here. If your auth logic is in a separate file, you'll need to access it.
// One way is to attach it to the app object, though not always the cleanest:
// app.set('jwtSecret', JWT_SECRET);

// Body Parser Middleware to handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic Route for testing
app.get('/', (req: Request, res: Response) => {
  res.send('Windsurf Gym App Server is running!');
});

// API Routes (to be created)
// import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes'; // Added authentication routes
import workoutRoutes from './routes/workoutRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import weightRoutes from './routes/weightRoutes'; // Added weight routes
import profileRoutes from './routes/profileRoutes'; // Added profile routes

// app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); // Added authentication routes
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/weight', weightRoutes); // Added weight routes
app.use('/api/profile', profileRoutes); // Added profile routes

// Global Error Handler (simple example, can be more sophisticated)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// Define Port (Hardcoded for local development)
const PORT = 5001;
const NODE_ENV = 'development'; // Hardcoded for local development

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

export default app; // For testing purposes if needed
