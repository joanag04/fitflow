import React from 'react';
import { Link } from 'react-router-dom';
import type { Meal } from '../pages/NutritionPage';
import './MealCard.css';

interface MealCardProps {
  meal: Meal;
  logDate: string;
  logId: string;
}

const MealCard: React.FC<MealCardProps> = ({ meal, logDate, logId }) => {
  // Calcular totais para esta refeição
  const totalCalories = meal.foodItems.reduce((sum, item) => sum + (item.calories * item.quantity), 0);
  const totalProtein = meal.foodItems.reduce((sum, item) => sum + (item.protein * item.quantity), 0);
  const totalCarbs = meal.foodItems.reduce((sum, item) => sum + (item.carbs * item.quantity), 0);
  const totalFat = meal.foodItems.reduce((sum, item) => sum + (item.fat * item.quantity), 0);

  // Formatar a hora da refeição
  const mealTime = new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Link 
      to={`/nutrition/${logId}/meals/${meal.id || meal.name}`} 
      className="meal-card-link"
      state={{ 
        meal: { ...meal, id: meal.id || meal.name },
        logDate 
      }}
    >
      <div className="meal-card">
        <div className="meal-card-header">
          <h3 className="meal-card-title">{meal.name}</h3>
          <span className="meal-time">{mealTime}</span>
        </div>
        <div className="meal-card-summary">
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalCalories)}</span>
            <span className="summary-label">Calories</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalProtein)}g</span>
            <span className="summary-label">Protein</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalCarbs)}g</span>
            <span className="summary-label">Carbs</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalFat)}g</span>
            <span className="summary-label">Fat</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MealCard;
