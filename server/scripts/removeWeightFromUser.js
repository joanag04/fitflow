require('dotenv').config();
const mongoose = require('mongoose');

// Importar o modelo de usuário
const mongoose = require('mongoose');
const User = require('../models/User');

// Usar a mesma conexão do arquivo db.ts
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf-gym-app';

async function removeWeightFromUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Atualizar todos os usuários, removendo o campo weight
    const result = await User.updateMany(
      { weight: { $exists: true } }, // Filtra usuários com o campo weight
      { $unset: { weight: "" } } // Remove o campo weight
    );

    console.log(`Removed weight field from ${result.modifiedCount} users`);
    
    // Verificar se ainda existem usuários com o campo weight
    const usersWithWeight = await User.countDocuments({ weight: { $exists: true } });
    console.log(`Users still with weight field: ${usersWithWeight}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error removing weight field from users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executar a função
removeWeightFromUser().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
