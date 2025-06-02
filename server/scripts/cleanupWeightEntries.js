require('dotenv').config();
const mongoose = require('mongoose');
const WeightEntry = require('../src/models/WeightEntry');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function cleanupWeightEntries() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // First, check if there are any entries left
    const count = await WeightEntry.countDocuments({});
    console.log(`Found ${count} weight entries to delete`);
    
    if (count > 0) {
      // Delete all weight entries
      await WeightEntry.deleteMany({});
      console.log(`Deleted ${count} weight entries`);
    } else {
      console.log('No weight entries found to delete');
    }
    
    // Optionally, you can drop the entire collection
    // Uncomment the following lines if you want to drop the collection
    // await mongoose.connection.db.dropCollection('weightentries');
    // console.log('Dropped weightentries collection');
    
    console.log('Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupWeightEntries();
