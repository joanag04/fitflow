import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../src/models/User';
import WeightEntry from '../src/models/WeightEntry';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function migrateGoalWeights() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Encontrar todos os usuários com goalWeight definido
    const usersWithGoal = await User.find({ 
      goalWeight: { $exists: true, $ne: null } 
    });

    console.log(`Found ${usersWithGoal.length} users with goalWeight to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithGoal) {
      try {
        // Verificar se já existe uma entrada de peso para este usuário
        const existingEntry = await WeightEntry.findOne({ 
          user: user._id,
          isGoalWeight: true
        });

        if (existingEntry) {
          console.log(`Goal weight already exists for user ${user._id}, skipping...`);
          skippedCount++;
          continue;
        }

        // Criar uma nova entrada de peso para o goalWeight
        const goalEntry = new WeightEntry({
          user: user._id,
          date: new Date(),
          weight: user.goalWeight,
          isGoalWeight: true,
          notes: 'Goal weight migrated from user profile'
        });

        await goalEntry.save();
        migratedCount++;
        
        console.log(`Migrated goal weight for user ${user._id}`);
      } catch (error) {
        console.error(`Error migrating goal weight for user ${user._id}:`, error);
      }
    }

    console.log('Migration completed:');
    console.log(`- Users processed: ${usersWithGoal.length}`);
    console.log(`- Goal weights migrated: ${migratedCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);

    // Não remover o campo goalWeight dos usuários ainda
    // Isso será feito em uma etapa posterior, após confirmar que a migração foi bem-sucedida

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executar a migração
migrateGoalWeights().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
