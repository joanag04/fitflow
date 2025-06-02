import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    // !!! IMPORTANT: Hardcoded for local development. Change if your MongoDB URI is different. !!!
    const mongoURI = "mongodb://localhost:27017/windsurf-gym-app";
    

    // Mongoose connection options
    // As of Mongoose 6, useNewUrlParser, useUnifiedTopology, useCreateIndex, and useFindAndModify are no longer needed
    // and are true by default or no longer relevant.
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
