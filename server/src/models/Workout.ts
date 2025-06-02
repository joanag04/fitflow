import { Schema, model, Document, Types } from 'mongoose';

// Interface for Set within an Exercise
interface ISet {
  weight: number;      // Weight used (e.g., in kg or lbs)
  reps: number;        // Number of repetitions
  completed: boolean;  // Status of the set
  // _id is not needed if it's a subdocument not intended for individual query
}

// Interface for Exercise within a Workout
interface IExercise {
  name: string;        // Name of the exercise (e.g., "Bench Press", "Squat")
  sets: Types.DocumentArray<ISet>; // Array of sets
  notes?: string;       // Notes for the exercise (e.g., "Felt strong", "Focus on form") (optional)
  // _id is not needed if it's a subdocument not intended for individual query
}

// Interface for Workout attributes, extending Mongoose Document
interface IWorkout extends Document {
  userId: Types.ObjectId; // Reference to the User (original: user)
  title: string;          // Title of the workout (e.g., "Chest Day", "Full Body Workout")
  date: Date;             // Date of the workout
  exercises: Types.DocumentArray<IExercise>; // Array of exercises
  duration?: number;       // Duration of the workout in minutes (optional, can be calculated or user-input)
  notes?: string;          // General notes for the workout (optional)
  completed: boolean;     // Status of the workout (e.g., fully completed, partially completed)
  // createdAt, updatedAt will be added by timestamps:true
}

const setSchema = new Schema<ISet>(
  {
    weight: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false } // No separate _id for sets as they are part of an exercise
);

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: [setSchema], required: true }, // Array of set subdocuments
    notes: { type: String, trim: true, optional: true },
  },
  { _id: false } // No separate _id for exercises if they are always part of a workout
);

const workoutSchema = new Schema<IWorkout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    exercises: { type: [exerciseSchema], required: true }, // Array of exercise subdocuments
    duration: { type: Number, min: 0, optional: true },
    notes: { type: String, trim: true, optional: true },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Index for common queries
workoutSchema.index({ userId: 1, date: -1 });

const Workout = model<IWorkout>('Workout', workoutSchema);

export default Workout;
export { IWorkout, IExercise, ISet }; // Exporting interfaces
