import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { NutritionLog, Meal } from './NutritionPage';
import './NutritionLogDetailPage.css';

const NutritionLogDetailPage: React.FC = () => {
  const { logId } = useParams<{ logId: string }>();
  const [nutritionLog, setNutritionLog] = useState<NutritionLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNutritionLog = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/nutrition/logs/${logId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch nutrition log');
        }

        const data = await response.json();
        setNutritionLog(data);
      } catch (err) {
        console.error('Error fetching nutrition log:', err);
        setError('Failed to load nutrition log. Please try again later.');
        toast.error('Failed to load nutrition log');
      } finally {
        setIsLoading(false);
      }
    };

    if (logId) {
      fetchNutritionLog();
    }
  }, [logId, navigate]);

  const handleEditMeal = (mealId: string) => {
    if (!mealId) {
      console.error('Cannot edit meal: meal ID is missing');
      return;
    }
    // Navigate to the edit route with the meal ID
    navigate(`/nutrition/meals/${mealId}/edit`, { 
      state: { 
        logId: logId,
        meal: nutritionLog?.meals.find(m => m.id === mealId)
      } 
    });
  };

  const calculateMealTotals = (meal: Meal) => {
    return meal.foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories * item.quantity),
        protein: acc.protein + (item.protein * item.quantity),
        carbs: acc.carbs + (item.carbs * item.quantity),
        fat: acc.fat + (item.fat * item.quantity),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading nutrition log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!nutritionLog) {
    return (
      <div className="not-found">
        <h2>Nutrition log not found</h2>
        <button onClick={() => navigate('/nutrition')} className="btn-primary">
          Back to Nutrition
        </button>
      </div>
    );
  }

  return (
    <div className="nutrition-log-detail">
      <div className="header">
        <h1>
          Nutrition Log - {new Date(nutritionLog.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </h1>
      </div>

      <div className="nutrition-summary">
        <h2>Daily Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-value">{nutritionLog.totalCalories || 0}</span>
            <span className="summary-label">Calories</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{nutritionLog.totalProtein || 0}g</span>
            <span className="summary-label">Protein</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{nutritionLog.totalCarbs || 0}g</span>
            <span className="summary-label">Carbs</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{nutritionLog.totalFat || 0}g</span>
            <span className="summary-label">Fat</span>
          </div>
          {nutritionLog.waterIntake && (
            <div className="summary-item">
              <span className="summary-value">{nutritionLog.waterIntake}ml</span>
              <span className="summary-label">Water</span>
            </div>
          )}
        </div>
      </div>

      {nutritionLog.notes && (
        <div className="notes-section">
          <h3>Notes</h3>
          <p className="notes-content">{nutritionLog.notes}</p>
        </div>
      )}

      <div className="meals-section">
        <h2>Meals</h2>
        {nutritionLog.meals.map((meal) => {
          const mealTotals = calculateMealTotals(meal);
          return (
            <div key={meal.id} className="meal-card">
              <div className="meal-header">
                <div>
                  <h3>{meal.name}</h3>
                  <span className="meal-time">
                    {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button 
                  onClick={() => meal.id && handleEditMeal(meal.id.toString())}
                  className="btn-icon"
                  aria-label={`Edit ${meal.name}`}
                  disabled={!meal.id}
                >
                  <FaEdit />
                </button>
              </div>
              
              <div className="meal-summary">
                <span>{mealTotals.calories.toFixed(0)} cal</span>
                <span>P: {mealTotals.protein.toFixed(1)}g</span>
                <span>C: {mealTotals.carbs.toFixed(1)}g</span>
                <span>F: {mealTotals.fat.toFixed(1)}g</span>
              </div>

              <div className="food-items">
                <h4>Food Items</h4>
                <ul>
                  {meal.foodItems.map((item, index) => (
                    <li key={item.id || index} className="food-item">
                      <span className="food-name">{item.name}</span>
                      <span className="food-details">
                        {item.quantity} {item.servingSize ? `(${item.servingSize})` : ''} • 
                        {item.calories * item.quantity} cal • 
                        P:{(item.protein * item.quantity).toFixed(1)}g • 
                        C:{(item.carbs * item.quantity).toFixed(1)}g • 
                        F:{(item.fat * item.quantity).toFixed(1)}g
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionLogDetailPage;
