import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User attributes, extending Mongoose Document
interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // Renamed from 'password' to indicate it's hashed
  height?: number;      // User height in cm (optional)
  weight?: number;      // Current weight in kg (optional)
  goalWeight?: number;  // Target weight in kg (optional)
  createdAt: Date; // Mongoose timestamps option adds this automatically
  updatedAt: Date; // Mongoose timestamps option adds this automatically
  currentStreak: number; // Current workout streak
  lastActivityDate?: Date; // Date of the last qualifying activity (workout or meal)
  workoutsCompleted: number; // Count of completed workouts
  mealsTracked: number; // Count of tracked meals
  streakStartDate?: Date; // Date current streak started
  points: number;        // Gamification points
  level: number;         // User level
  nextLevelPoints: number; // Points needed for next level
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      // Basic email validation, more robust validation can be added
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    passwordHash: { type: String, required: true, select: false }, // select: false to exclude by default
    height: { type: Number, min: 0, optional: true },
    weight: { type: Number, min: 0, optional: true },
    goalWeight: { type: Number, min: 0, optional: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: Date, optional: true },
    workoutsCompleted: { type: Number, default: 0, min: 0 },
    mealsTracked: { type: Number, default: 0, min: 0 },
    streakStartDate: { type: Date, optional: true },
    points: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    nextLevelPoints: { type: Number, default: 100, min: 0 }, // Example initial value
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    toObject: { virtuals: true }, // Ensure virtuals are included when converting to an object
    toJSON: { virtuals: true }    // Ensure virtuals are included when converting to JSON
  }
);

// Index for frequently queried fields
userSchema.index({ email: 1 });

// Pre-save hook for password hashing
userSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    // If error is an instance of Error, pass it to next, otherwise create a new Error.
    // This ensures that 'error' is always an Error object.
    if (error instanceof Error) {
        return next(error);
    } 
    return next(new Error('Error hashing password'));
  }
});

// Method to compare candidate password with the stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = model<IUser>('User', userSchema);

export default User;
export { IUser }; // Exporting the interface for use in other parts of the application
