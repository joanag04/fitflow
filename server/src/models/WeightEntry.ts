import mongoose, { Document, Schema } from 'mongoose';

export interface IWeightEntry extends Document {
  user: mongoose.Schema.Types.ObjectId; // Reference to the User model
  date: Date;
  weight?: number; // Opcional para permitir entradas que são apenas goal weight
  notes?: string;
  goalWeight?: number; // Peso objetivo do utilizador
}

const WeightEntrySchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Assumes your User model is named 'User'
    },
    date: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      required: false,
      default: null,
      validate: [
        {
          validator: function(this: IWeightEntry, value: number | null): boolean {
            // Pelo menos um dos campos deve estar preenchido
            return value !== null || this.goalWeight !== null;
          },
          message: 'Pelo menos um dos campos (weight ou goalWeight) deve ser fornecido'
        }
      ]
    },
    notes: {
      type: String,
      required: false,
    },
    goalWeight: {
      type: Number,
      required: false,
      default: null,
      validate: [
        {
          validator: function(this: IWeightEntry, value: number | null): boolean {
            // Pelo menos um dos campos deve estar preenchido
            return value !== null || this.weight !== null;
          },
          message: 'Pelo menos um dos campos (weight ou goalWeight) deve ser fornecido'
        }
      ]
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const WeightEntry = mongoose.model<IWeightEntry>('WeightEntry', WeightEntrySchema);

export default WeightEntry;
