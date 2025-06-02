import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import WeightEntry from '../src/models/WeightEntry';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function updateGoalWeightField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Encontrar todas as entradas que tinham isGoalWeight = true
    const entriesToUpdate = await WeightEntry.find({ isGoalWeight: true });

    console.log(`Found ${entriesToUpdate.length} entries to update`);

    // Atualizar cada entrada para o novo formato
    for (const entry of entriesToUpdate) {
      try {
        // Definir goalWeight com o valor de weight e remover isGoalWeight
        await WeightEntry.updateOne(
          { _id: entry._id },
          { 
            $set: { 
              goalWeight: entry.weight 
            },
            $unset: { 
              isGoalWeight: "" 
            }
          }
        );
        console.log(`Updated entry ${entry._id}`);
      } catch (error) {
        console.error(`Error updating entry ${entry._id}:`, error);
      }
    }

    console.log('Migration completed successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executar a migração
updateGoalWeightField().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
