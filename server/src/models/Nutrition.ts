import { Schema, model, Document, Types } from 'mongoose';

// Interface for FoodItem within a Meal
interface IFoodItem {
  name: string;          // Name of the food item (e.g., "Chicken Breast", "Brown Rice")
  calories: number;      // Calories
  protein: number;       // Protein (g)
  carbs: number;         // Carbohydrates (g)
  fat: number;           // Fat (g)
  servingSize?: string;   // Serving size description (e.g., "100g", "1 cup") (optional)
  quantity: number;      // Quantity consumed (e.g., 1.5 for 1.5 servings)
  // _id is not needed if it's a subdocument
}

// Interface for Meal within a Nutrition entry
interface IMeal {
  name: string;          // Name of the meal (e.g., "Breakfast", "Lunch", "Snack")
  time: Date;            // Time of the meal
  foodItems: Types.DocumentArray<IFoodItem>; // Array of food items
  // _id is not needed if it's a subdocument
}

// Interface for Nutrition attributes, extending Mongoose Document
interface INutrition extends Document {
  userId: Types.ObjectId; // Reference to the User
  date: Date;             // Date of the nutrition log
  meals: Types.DocumentArray<IMeal>; // Array of meals
  totalCalories: number;  // Total daily calories (can be calculated or user-input)
  totalProtein: number;   // Total daily protein (g)
  totalCarbs: number;     // Total daily carbohydrates (g)
  totalFat: number;       // Total daily fat (g)
  waterIntake?: number;   // Daily water intake (ml) (optional, as per original schema)
  notes?: string;          // Nutrition notes (optional)
  // createdAt, updatedAt will be added by timestamps:true
}

const foodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    servingSize: { type: String, trim: true, optional: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false } // Subdocuments don't need their own _id unless queried independently
);

const mealSchema = new Schema<IMeal>(
  {
    name: { type: String, required: true, trim: true },
    time: { type: Date, required: true },
    foodItems: { type: [foodItemSchema], required: true }, // Array of foodItem subdocuments
  },
  { _id: false }
);

const nutritionSchema = new Schema<INutrition>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    meals: { type: [mealSchema], required: true }, // Array of meal subdocuments
    totalCalories: { type: Number, default: 0, min: 0 },
    totalProtein: { type: Number, default: 0, min: 0 },
    totalCarbs: { type: Number, default: 0, min: 0 },
    totalFat: { type: Number, default: 0, min: 0 },
    waterIntake: { type: Number, min: 0, optional: true },
    notes: { type: String, trim: true, optional: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Index for common queries
nutritionSchema.index({ userId: 1, date: -1 });

// Pre-save hook to calculate total macros (optional, can also be done on client or service layer)
nutritionSchema.pre<INutrition>('save', function (next) {
  if (this.isModified('meals') || this.isNew) { // Recalculate if meals changed or it's a new document
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    this.meals.forEach(meal => {
      meal.foodItems.forEach(item => {
        calories += (item.calories || 0) * (item.quantity || 0);
        protein += (item.protein || 0) * (item.quantity || 0);
        carbs += (item.carbs || 0) * (item.quantity || 0);
        fat += (item.fat || 0) * (item.quantity || 0);
      });
    });

    this.totalCalories = parseFloat(calories.toFixed(2));
    this.totalProtein = parseFloat(protein.toFixed(2));
    this.totalCarbs = parseFloat(carbs.toFixed(2));
    this.totalFat = parseFloat(fat.toFixed(2));
  }
  next();
});

const Nutrition = model<INutrition>('Nutrition', nutritionSchema);

export default Nutrition;
export { INutrition, IMeal, IFoodItem }; // Exporting interfaces
