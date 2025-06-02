require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Importar os modelos
const User = require('../src/models/User');
const WeightEntry = require('../src/models/WeightEntry');

// Usar a mesma conexão do arquivo db.ts
const MONGODB_URI = 'mongodb://localhost:27017/windsurf-gym-app';

async function migrateWeights() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verificar se existem entradas de peso
    const weightEntries = await WeightEntry.find({}).sort({ user: 1, date: -1 });
    
    if (weightEntries.length === 0) {
      console.log('No weight entries found to migrate.');
      process.exit(0);
    }
    
    console.log(`Found ${weightEntries.length} weight entries to process`);
    
    // Agrupar por usuário e pegar a entrada mais recente
    const latestWeights = new Map();
    
    weightEntries.forEach(entry => {
      const userId = entry.user.toString();
      if (!latestWeights.has(userId)) {
        latestWeights.set(userId, entry);
      }
    });
    
    console.log(`Found ${latestWeights.size} unique users with weight entries`);
    
    // Atualizar cada usuário com o peso mais recente
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
    
    // Opcional: descomente as linhas abaixo para limpar a coleção de entradas de peso após a migração
    // await WeightEntry.deleteMany({});
    // console.log('Weight entries collection cleared');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Executar a migração
migrateWeights().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
