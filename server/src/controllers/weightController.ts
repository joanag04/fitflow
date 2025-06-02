import { Response } from 'express';
import mongoose from 'mongoose';
import WeightEntry, { IWeightEntry } from '../models/WeightEntry';
import { ExtendedRequest } from '../middleware/authMiddleware'; // For req.user

// @desc    Get all weight entries for the logged-in user
// @route   GET /api/weight
// @access  Private
export const getWeightEntries = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    // Fetch entries for the logged-in user, sorted by date in ascending order
    const weightEntries = await WeightEntry.find({ user: req.user.id }).sort({ date: 'asc' });
    res.status(200).json(weightEntries);
  } catch (error: any) {
    console.error('Error fetching weight entries:', error);
    res.status(500).json({ message: 'Server error while fetching weight entries', error: error.message });
  }
};

// @desc    Log a new weight entry for the logged-in user
// @route   POST /api/weight
// @access  Private
export const logWeightEntry = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { date, weight, notes } = req.body;

    if (!date || weight === undefined) {
      return res.status(400).json({ message: 'Date and weight are required fields' });
    }

    // Se for um goal weight, primeiro remova qualquer goal weight existente
    if (req.body.goalWeight !== undefined) {
      // Não precisamos mais remover goal weights antigos, pois agora cada entrada pode ter seu próprio goalWeight
    }

    const newWeightEntry: IWeightEntry = new WeightEntry({
      user: new mongoose.Types.ObjectId(req.user.id),
      date: new Date(date), // Ensure date is stored as a Date object
      weight: Number(weight),
      notes,
      goalWeight: req.body.goalWeight !== undefined ? Number(req.body.goalWeight) : undefined
    });

    const savedEntry = await newWeightEntry.save();
    res.status(201).json(savedEntry);
  } catch (error: any) {
    console.error('Error logging weight entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while logging weight entry', error: error.message });
  }
};

// @desc    Get the current goal weight for the logged-in user
// @route   GET /api/weight/goal
// @access  Private
export const getGoalWeight = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const goalWeightEntry = await WeightEntry.findOne({
      user: req.user.id,
      goalWeight: { $exists: true, $ne: null },
      weight: null // Buscar apenas entradas que são apenas goal weight
    }).sort({ date: -1 }); // Get the most recent goal weight entry

    res.status(200).json(goalWeightEntry || null);
  } catch (error: any) {
    console.error('Error fetching goal weight:', error);
    res.status(500).json({ message: 'Server error while fetching goal weight', error: error.message });
  }
};

// @desc    Set or update the goal weight for the logged-in user
// @route   POST /api/weight/goal
// @access  Private
export const setGoalWeight = async (req: ExtendedRequest, res: Response) => {
  try {
    console.log('setGoalWeight - Iniciando...');
    console.log('Usuário autenticado:', req.user?.id);
    
    if (!req.user?.id) {
      console.error('Erro: Usuário não autenticado');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { weight } = req.body;
    console.log('Peso recebido:', weight);
    
    if (weight === undefined) {
      console.error('Erro: Peso não fornecido');
      return res.status(400).json({ message: 'Weight is a required field' });
    }

    // Criar uma nova entrada para o goal weight sem afetar o peso atual
    try {
      console.log('Criando nova entrada de goal weight...');
      const newGoalWeightEntry = new WeightEntry({
        user: new mongoose.Types.ObjectId(req.user.id),
        date: new Date(),
        weight: null, // Não definir o peso, apenas o goalWeight
        goalWeight: Number(weight),
        notes: 'Goal weight set by user'
      });

      console.log('Nova entrada de goal weight:', newGoalWeightEntry);
      
      // Validar manualmente para pegar erros de validação
      const validationError = newGoalWeightEntry.validateSync();
      if (validationError) {
        console.error('Erro de validação:', validationError);
        const errorMessage = Object.values(validationError.errors).map((e: any) => e.message).join(', ');
        return res.status(400).json({ 
          message: `Erro de validação: ${errorMessage}`,
          details: validationError.errors 
        });
      }
      
      const savedEntry = await newGoalWeightEntry.save();
      console.log('Goal weight salvo com sucesso:', savedEntry);
      
      res.status(201).json(savedEntry);
    } catch (saveError: any) {
      console.error('Erro ao salvar o goal weight:', saveError);
      if (saveError.name === 'ValidationError') {
        const errorMessage = Object.values(saveError.errors).map((e: any) => e.message).join(', ');
        return res.status(400).json({ 
          message: `Erro de validação: ${errorMessage}`,
          details: saveError.errors 
        });
      }
      throw saveError; // Re-throw para ser capturado pelo bloco catch externo
    }
  } catch (error: any) {
    console.error('Error setting goal weight:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while setting goal weight', error: error.message });
  }
};
