import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Importar os modelos
import User from '../src/models/User.js';
import WeightEntry from '../src/models/WeightEntry.js';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function migrateWeights() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verificar se existem entradas de peso
    const weightEntries = await WeightEntry.find({}).sort({ user: 1, date: -1 });
    
    if (weightEntries.length === 0) {
      console.log('No weight entries found to migrate.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log(`Found ${weightEntries.length} weight entries to process`);
    
    // Agrupar por usuário e pegar a entrada mais recente
    const latestWeights = new Map();
    
    weightEntries.forEach((entry: any) => {
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
      } catch (err: any) {
        console.error(`Error updating user ${userId}:`, err.message);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} users with their latest weight.`);
    
    // Opcional: descomente as linhas abaixo para limpar a coleção de entradas de peso após a migração
    // await WeightEntry.deleteMany({});
    // console.log('Weight entries collection cleared');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executar a migração
migrateWeights().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
