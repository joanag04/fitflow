require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const WeightEntry = require('../src/models/WeightEntry');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function migrateWeights() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all weight entries, sorted by user and date
    const weightEntries = await WeightEntry.find({}).sort({ user: 1, date: -1 });
    
    console.log(`Found ${weightEntries.length} weight entries to process`);
    
    // Group by user and get the most recent entry
    const latestWeights = new Map();
    
    weightEntries.forEach(entry => {
      const userId = entry.user.toString();
      if (!latestWeights.has(userId)) {
        latestWeights.set(userId, entry);
      }
    });
    
    console.log(`Found ${latestWeights.size} unique users with weight entries`);
    
    // Update each user with their latest weight
    let updatedCount = 0;
    for (const [userId, entry] of latestWeights.entries()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.weight = entry.weight;
          await user.save();
          updatedCount++;
          console.log(`Updated user ${user.email} with weight ${entry.weight}kg`);
        }
      } catch (err) {
        console.error(`Error updating user ${userId}:`, err.message);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} users with their latest weight.`);
    
    // Optionally drop the weight entries collection
    // Uncomment the following lines if you want to drop the collection after migration
    // await WeightEntry.deleteMany({});
    // console.log('Weight entries collection cleared');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateWeights();
