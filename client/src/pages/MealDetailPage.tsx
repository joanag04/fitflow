import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaPlus, FaShare, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import './MealDetailPage.css';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  servingSize?: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  foodItems: FoodItem[];
  notes?: string;
  waterIntake?: number;
  date?: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  logId?: string;
  nutritionLogId?: string;
}

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealDetailPageLocationState {
  meal?: Meal;
  logDate?: string;
  onUpdate?: (updatedMeal: Meal) => void;
}

interface MealDetailPageProps {
  editMode?: boolean;
}

const MealDetailPage: React.FC<MealDetailPageProps> = ({ editMode = false }) => {
  // State for edit mode and form data
  const [isEditing, setIsEditing] = useState(editMode);
  const [editedMeal, setEditedMeal] = useState<Partial<Meal> | null>(null);
  const [newFoodItem, setNewFoodItem] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    quantity: number;
  }>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: '',
    quantity: 1
  });
  const [isAddingFoodItem, setIsAddingFoodItem] = useState(false);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const { logId, mealId } = useParams<{ logId: string; mealId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string>('');
  const [isUpdatingWater, setIsUpdatingWater] = useState<boolean>(false);

  // Load meal data when component mounts or dependencies change
  // Update water intake when meal data changes
  useEffect(() => {
    if (meal?.waterIntake !== undefined) {
      setWaterIntake(meal.waterIntake);
    }
  }, [meal]);

  useEffect(() => {
    const loadMealData = async () => {
      // Check if we have meal data in location state (from navigation)
      const locationState = location.state as MealDetailPageLocationState | undefined;
      
      if (locationState?.meal) {
        setMeal(locationState.meal);
        setEditedMeal({ ...locationState.meal });
        if (locationState.logDate) {
          setLogDate(locationState.logDate);
        }
        if (locationState.meal.waterIntake !== undefined) {
          setWaterIntake(locationState.meal.waterIntake);
        }
        return;
      }

      // If no meal in location state, fetch it from the API
      if (!logId || !mealId) {
        setError('Missing log or meal identifier');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(`/nutrition/logs/${logId}/meals/${mealId}`);
        setMeal(response.data);
        setEditedMeal({ ...response.data });
        setLogDate(response.data.date || '');
      } catch (err: any) {
        console.error('Failed to fetch meal details:', err);
        setError(err.response?.data?.message || 'Failed to load meal details');
      } finally {
        setIsLoading(false);
      }
    };

    loadMealData();
  }, [logId, mealId, location.state]);
  
  // Handle water intake update
  const handleWaterIntakeChange = async (amount: number) => {
    if (!logId || isUpdatingWater) return;
    
    const newAmount = Math.max(0, waterIntake + amount);
    setWaterIntake(newAmount);
    setIsUpdatingWater(true);
    
    try {
      const response = await api.put(`/nutrition/logs/${logId}`, { 
        waterIntake: newAmount 
      });
      
      setMeal(prev => prev ? { ...prev, waterIntake: newAmount } : null);
      
      // Update parent component if needed
      const locationState = location.state as MealDetailPageLocationState | undefined;
      if (locationState?.onUpdate) {
        locationState.onUpdate({ ...response.data });
      }
      
      toast.success('Water intake updated');
    } catch (error) {
      console.error('Error updating water intake:', error);
      toast.error('Failed to update water intake');
      // Revert on error
      setWaterIntake(prev => prev - amount);
    } finally {
      setIsUpdatingWater(false);
    }
  };
  
  // Handle manual water intake input
  const handleWaterIntakeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newAmount = Math.max(0, value);
    
    if (newAmount === waterIntake) return;
    
    setWaterIntake(newAmount);
    
    if (!logId) return;
    
    try {
      const response = await api.put(`/nutrition/logs/${logId}`, { 
        waterIntake: newAmount 
      });
      
      setMeal(prev => prev ? { ...prev, waterIntake: newAmount } : null);
      
      // Update parent component if needed
      const locationState = location.state as MealDetailPageLocationState | undefined;
      if (locationState?.onUpdate) {
        locationState.onUpdate({ ...response.data });
      }
    } catch (error) {
      console.error('Error updating water intake:', error);
      toast.error('Failed to update water intake');
      // Revert on error
      setWaterIntake(prev => prev);
    }
  };

  // Handle input changes for meal editing
  const handleMealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedMeal) return;
    
    const { name, value } = e.target;
    setEditedMeal({
      ...editedMeal,
      [name]: name === 'time' ? new Date(value) : value
    });
  };
  
  // Handle input changes for new food item
  const handleFoodItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFoodItem({
      ...newFoodItem,
      [name]: name === 'quantity' || name === 'calories' || name === 'protein' || name === 'carbs' || name === 'fat' 
        ? parseFloat(value) || 0 
        : value
    });
  };
  
  // Save edited meal
  const handleSaveMeal = async () => {
    if (!editedMeal || !logId || !mealId) return;
    
    try {
      const response = await api.put(`/nutrition/logs/${logId}/meals/${mealId}`, editedMeal);
      setMeal(response.data);
      setIsEditing(false);
      
      // Update the parent component if needed
      const locationState = location.state as MealDetailPageLocationState | undefined;
      if (locationState?.onUpdate) {
        locationState.onUpdate(response.data);
      }
      
      toast.success('Meal updated successfully');
    } catch (error) {
      console.error('Error updating meal:', error);
      toast.error('Failed to update meal');
    }
  };
  
  // Add a new food item to the meal
  const handleAddFoodItem = async () => {
    if (!editedMeal || !newFoodItem.name) return;
    
    try {
      setIsLoading(true);
      
      const updatedMeal = {
        ...meal,
        foodItems: [
          ...(meal?.foodItems || []),
          {
            ...newFoodItem,
            id: Date.now().toString(),
            quantity: Number(newFoodItem.quantity) || 1
          }
        ]
      };
      
      // Update the meal on the server
      const response = await api.put(`/api/nutrition/logs/${logId}/meals/${mealId}`, {
        ...updatedMeal,
        foodItems: updatedMeal.foodItems.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 1
        }))
      });
      
      setMeal(response.data);
      
      // Show success message
      toast.success('Food item added successfully');
      
      // Reset the form
      setNewFoodItem({
        name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servingSize: '',
        quantity: 1
      });
      
      // Close the form
      setIsAddingFoodItem(false);
      
      toast.success('Food item added successfully');
    } catch (error) {
      console.error('Error updating food item:', error);
      toast.error('Failed to update food item. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate macros from food items
  const calculatedMacros = useCallback((): MacroTotals => {
    if (!meal?.foodItems?.length) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    return meal.foodItems.reduce<MacroTotals>(
      (totals, item) => ({
        calories: totals.calories + (item.calories || 0) * (item.quantity || 1),
        protein: totals.protein + (item.protein || 0) * (item.quantity || 1),
        carbs: totals.carbs + (item.carbs || 0) * (item.quantity || 1),
        fat: totals.fat + (item.fat || 0) * (item.quantity || 1)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meal]);
  
  // Use calculated values if not explicitly set on the meal
  const { calories: calculatedCalories, protein: calculatedProtein, carbs: calculatedCarbs, fat: calculatedFat } = calculatedMacros();
  const totalCalories = meal?.totalCalories ?? calculatedCalories;
  const totalProtein = meal?.totalProtein ?? calculatedProtein;
  const totalCarbs = meal?.totalCarbs ?? calculatedCarbs;
  const totalFat = meal?.totalFat ?? calculatedFat;

  // Handle removing a food item by ID or index
  const handleRemoveFoodItem = async (foodItemId: string | number) => {
    if (!meal || !window.confirm('Are you sure you want to remove this food item?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Handle both string ID and numeric index
      const updatedFoodItems = typeof foodItemId === 'number'
        ? meal.foodItems.filter((_, index) => index !== foodItemId)
        : meal.foodItems.filter(item => item.id !== foodItemId);
      
      const updatedMeal = { ...meal, foodItems: updatedFoodItems };
      
      // Use the logId from URL params or meal object
      const logIdToUse = logId || meal.nutritionLogId || meal.logId;
      if (!logIdToUse) {
        throw new Error('Nutrition log ID is missing');
      }
      
      const response = await api.put(`/api/nutrition/logs/${logIdToUse}/meals/${meal.id}`, updatedMeal);
      setMeal(response.data);
      
      toast.success('Food item removed successfully');
    } catch (error) {
      console.error('Error removing food item:', error);
      toast.error('Failed to remove food item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating a food item
  const handleUpdateFoodItem = async (foodItemId: string, updates: Partial<FoodItem>) => {
    if (!meal) return;
    
    try {
      setIsLoading(true);
      
      const updatedFoodItems = meal.foodItems.map(item => 
        item.id === foodItemId ? { ...item, ...updates } : item
      );
      
      const updatedMeal = { ...meal, foodItems: updatedFoodItems };
      
      const response = await api.put(`/api/nutrition/logs/${meal.logId}/meals/${meal.id}`, updatedMeal);
      setMeal(response.data);
      
      toast.success('Food item updated successfully');
    } catch (error) {
      console.error('Error updating food item:', error);
      toast.error('Failed to update food item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

// ...
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing && meal) {
      setEditedMeal({ ...meal });
    }
  };
  
  // Share meal details
  const handleShareMeal = () => {
    if (!meal) return;
    
    const mealText = `${meal.name} - ${new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `Calories: ${Math.round(meal.foodItems.reduce((sum, item) => sum + (item.calories * item.quantity), 0))}\n` +
      `Protein: ${Math.round(meal.foodItems.reduce((sum, item) => sum + (item.protein * item.quantity), 0))}g\n` +
      `Carbs: ${Math.round(meal.foodItems.reduce((sum, item) => sum + (item.carbs * item.quantity), 0))}g\n` +
      `Fat: ${Math.round(meal.foodItems.reduce((sum, item) => sum + (item.fat * item.quantity), 0))}g`;
    
    if (navigator.share) {
      navigator.share({
        title: meal.name,
        text: mealText,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard(mealText);
      });
    } else {
      copyToClipboard(mealText);
    }
  };
  
  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Meal details copied to clipboard!'),
      () => toast.error('Failed to copy to clipboard')
    );
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  if (isLoading) {
    return (
      <div className="meal-detail-loading">
        <p>Loading meal details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meal-detail-error">
        <p>Error: {error}</p>
        <button 
          onClick={handleBack} 
          className="btn-back"
          aria-label="Go back to nutrition log"
        >
          Back to Nutrition Log
        </button>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="meal-detail-not-found">
        <p>Meal not found</p>
        <button onClick={handleBack} className="btn-back">
          Back to Nutrition Log
        </button>
      </div>
    );
  }

  // Calculate totals for the meal considering quantities
  const mealMacros = calculatedMacros();
  // Format the meal time with error handling
  const mealTime = (() => {
    try {
      const date = new Date(meal.time);
      return isNaN(date.getTime()) 
        ? '--:--' 
        : date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
    } catch (error) {
      console.error('Error formatting meal time:', error);
      return '--:--';
    }
  })();

  // Format the log date with error handling
  const formattedDate = (() => {
    if (!logDate) return '';
    try {
      const date = new Date(logDate);
      return isNaN(date.getTime()) 
        ? '' 
        : date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
    } catch (error) {
      console.error('Error formatting log date:', error);
      return '';
    }
  })();
  
  // Helper function to render macro info
  const renderMacroInfo = (label: string, value: number, unit: string = 'g') => (
    <div className="macro-info">
      <span className="macro-value">{value.toFixed(1)}<span className="macro-unit">{unit}</span></span>
      <span className="macro-label">{label}</span>
    </div>
  );

  return (
    <div className="meal-detail-container">
      <div className="meal-detail-header">
        <div className="header-actions">
          <button 
            onClick={handleBack} 
            className="btn-back"
            aria-label="Go back to previous page"
          >
            &larr; Back
          </button>
          <div className="action-buttons">
            <button 
              onClick={toggleEditMode} 
              className="btn-icon" 
              title={isEditing ? 'Cancel Edit' : 'Edit Meal'}
              aria-label={isEditing ? 'Cancel editing' : 'Edit meal details'}
            >
              {isEditing ? <FaTimes aria-hidden="true" /> : <FaEdit aria-hidden="true" />}
            </button>
            <button 
              onClick={handleShareMeal} 
              className="btn-icon" 
              title="Share Meal"
              aria-label="Share meal details"
            >
              <FaShare aria-hidden="true" />
            </button>
          </div>
        </div>
        
        <div className="meal-info">
          <h1 className="meal-name">{meal.name || 'Unnamed Meal'}</h1>
          <div className="meal-meta">
            {formattedDate && (
              <span className="meal-date">{formattedDate}</span>
            )}
            <span className="meal-time">{mealTime}</span>
          </div>
        </div>
        
        <div className="meal-macros">
          <div className="macro-total">
            <span className="macro-value">{Math.round(totalCalories)}<span className="macro-unit">kcal</span></span>
            <span className="macro-label">Calories</span>
          </div>
          {renderMacroInfo('Protein', totalProtein)}
          {renderMacroInfo('Carbs', totalCarbs)}
          {renderMacroInfo('Fat', totalFat)}
        </div>
        
        {/* Food Items Section */}
        <section className="food-items-section">
          <div className="section-header">
            <h2>Food Items</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsAddingFoodItem(true)}
                className="btn-add"
                aria-label="Add food item"
              >
                <FaPlus /> Add Food
              </button>
            )}
          </div>
          
          {meal.foodItems && meal.foodItems.length > 0 ? (
            <div className="food-items-grid">
              {meal.foodItems.map((item, index) => (
                <div key={index} className="food-item-card">
                  <div className="food-item-header">
                    <h3>{item.name}</h3>
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveFoodItem(index)}
                        className="btn-icon danger"
                        aria-label={`Remove ${item.name}`}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="food-item-quantity">
                    {item.quantity?.toString() || '1'} {item.servingSize ? `× ${item.servingSize}` : 'serving(s)'}
                  </div>
                  <div className="food-item-macros">
                    <div className="macro">
                      <span className="macro-value">{Math.round(item.calories * item.quantity)}</span>
                      <span className="macro-label">kcal</span>
                    </div>
                    <div className="macro">
                      <span className="macro-value">{(item.protein * item.quantity).toFixed(1)}</span>
                      <span className="macro-label">P</span>
                    </div>
                    <div className="macro">
                      <span className="macro-value">{(item.carbs * item.quantity).toFixed(1)}</span>
                      <span className="macro-label">C</span>
                    </div>
                    <div className="macro">
                      <span className="macro-value">{(item.fat * item.quantity).toFixed(1)}</span>
                      <span className="macro-label">F</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No food items added yet.</p>
              {!isEditing && (
                <button 
                  onClick={() => setIsAddingFoodItem(true)}
                  className="btn-primary"
                >
                  <FaPlus /> Add Your First Food Item
                </button>
              )}
            </div>
          )}
        </section>
        
        {isAddingFoodItem && (
          <div className="add-food-item-form">
            <h3>Add Food Item</h3>
            <div className="form-group">
              <label htmlFor="foodName">Food Name</label>
              <input
                type="text"
                id="foodName"
                value={newFoodItem.name || ''}
                onChange={(e) => setNewFoodItem({...newFoodItem, name: e.target.value})}
                placeholder="e.g., Grilled Chicken"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  min="0.1"
                  step="0.1"
                  value={newFoodItem.quantity || 1}
                  onChange={(e) => setNewFoodItem({...newFoodItem, quantity: parseFloat(e.target.value)})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="servingSize">Serving Size (optional)</label>
                <input
                  type="text"
                  id="servingSize"
                  value={newFoodItem.servingSize || ''}
                  onChange={(e) => setNewFoodItem({...newFoodItem, servingSize: e.target.value})}
                  placeholder="e.g., 100g"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="calories">Calories</label>
                <input
                  type="number"
                  id="calories"
                  min="0"
                  step="1"
                  value={newFoodItem.calories || ''}
                  onChange={(e) => setNewFoodItem({...newFoodItem, calories: parseFloat(e.target.value)})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="protein">Protein (g)</label>
                <input
                  type="number"
                  id="protein"
                  min="0"
                  step="0.1"
                  value={newFoodItem.protein || ''}
                  onChange={(e) => setNewFoodItem({...newFoodItem, protein: parseFloat(e.target.value)})}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="carbs">Carbs (g)</label>
                <input
                  type="number"
                  id="carbs"
                  min="0"
                  step="0.1"
                  value={newFoodItem.carbs || ''}
                  onChange={(e) => setNewFoodItem({...newFoodItem, carbs: parseFloat(e.target.value)})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fat">Fat (g)</label>
                <input
                  type="number"
                  id="fat"
                  min="0"
                  step="0.1"
                  value={newFoodItem.fat || ''}
                  onChange={(e) => setNewFoodItem({...newFoodItem, fat: parseFloat(e.target.value)})}
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setIsAddingFoodItem(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleAddFoodItem}
                className="btn-primary"
                disabled={!newFoodItem.name || !newFoodItem.calories}
              >
                Add Food
              </button>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="edit-meal-form">
            <input
              type="text"
              name="name"
              value={editedMeal?.name || ''}
              onChange={handleMealChange}
              placeholder="Meal name"
              className="meal-name-input"
            />
            <div className="meal-time-inputs">
              <input
                type="date"
                name="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="date-input"
              />
              <input
                type="time"
                name="time"
                value={editedMeal?.time ? new Date(editedMeal.time).toTimeString().substring(0, 5) : ''}
                onChange={handleMealChange}
                className="time-input"
              />
              <button onClick={handleSaveMeal} className="btn-save" disabled={!editedMeal?.name}>
                <FaCheck /> Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1>{meal.name}</h1>
            <div className="meal-meta">
              <span className="meal-time">{mealTime}</span>
              {formattedDate && <span className="meal-date">{formattedDate}</span>}
            </div>
          </>
        )}
      </div>

      <div className="nutrition-summary">
        <div className="section-header">
          <h2>Nutrition Summary</h2>
          
          {/* Water Intake Tracker */}
          <div className="water-intake-tracker">
            <div className="water-intake-header">
              <span className="water-intake-label">Water Intake</span>
              <span className="water-intake-amount">{waterIntake} ml</span>
            </div>
            <div className="water-intake-controls">
              <button 
                onClick={() => handleWaterIntakeChange(-250)}
                className="water-btn minus"
                disabled={waterIntake <= 0 || isUpdatingWater}
                title="Remove 250ml"
              >
                -250ml
              </button>
              <div className="water-input-container">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={waterIntake || 0}
                  onChange={handleWaterIntakeInput}
                  className="water-intake-input"
                  disabled={isUpdatingWater}
                />
                <span className="water-unit">ml</span>
              </div>
              <button 
                onClick={() => handleWaterIntakeChange(250)}
                className="water-btn plus"
                disabled={isUpdatingWater}
                title="Add 250ml"
              >
                +250ml
              </button>
            </div>
            <div className="water-progress">
              <div 
                className="water-progress-fill"
                style={{ width: `${Math.min(100, (waterIntake / 3000) * 100)}%` }}
                title={`${waterIntake}ml / 3000ml`}
              ></div>
              <div className="water-progress-labels">
                <span>0ml</span>
                <span>3L</span>
              </div>
            </div>
          </div>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalCalories)}</span>
            <span className="summary-label">Calories</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalProtein)}<span className="unit">g</span></span>
            <span className="summary-label">Protein</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalCarbs)}<span className="unit">g</span></span>
            <span className="summary-label">Carbs</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{Math.round(totalFat)}<span className="unit">g</span></span>
            <span className="summary-label">Fat</span>
          </div>
        </div>
        
        {/* Macronutrient Distribution Chart */}
        <div className="macronutrient-chart">
          <div className="chart-label">Macronutrient Distribution</div>
          <div className="chart-bars">
            <div 
              className="chart-bar protein" 
              style={{ width: `${(totalProtein * 4 / totalCalories) * 100}%` }}
              title={`Protein: ${Math.round((totalProtein * 4 / totalCalories) * 100)}%`}
            ></div>
            <div 
              className="chart-bar carbs" 
              style={{ width: `${(totalCarbs * 4 / totalCalories) * 100}%` }}
              title={`Carbs: ${Math.round((totalCarbs * 4 / totalCalories) * 100)}%`}
            ></div>
            <div 
              className="chart-bar fat" 
              style={{ width: `${(totalFat * 9 / totalCalories) * 100}%` }}
              title={`Fat: ${Math.round((totalFat * 9 / totalCalories) * 100)}%`}
            ></div>
          </div>
          <div className="chart-legend">
            <span className="legend-item protein">Protein</span>
            <span className="legend-item carbs">Carbs</span>
            <span className="legend-item fat">Fat</span>
          </div>
        </div>
      </div>

      <div className="food-items-section">
        <div className="section-header">
          <h2>Food Items</h2>
          {!isAddingFoodItem && (
            <button 
              onClick={() => setIsAddingFoodItem(true)} 
              className="btn-add"
              disabled={isEditing}
            >
              <FaPlus /> Add Food Item
            </button>
          )}
        </div>
        
        {/* Add Food Item Form */}
        {isAddingFoodItem && (
          <div className="add-food-item-form">
            <h3>Add New Food Item</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Food Name*</label>
                <input
                  type="text"
                  name="name"
                  value={newFoodItem.name}
                  onChange={handleFoodItemChange}
                  placeholder="e.g., Grilled Chicken"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="0.1"
                  step="0.1"
                  value={newFoodItem.quantity}
                  onChange={handleFoodItemChange}
                />
              </div>
              <div className="form-group">
                <label>Serving Size (optional)</label>
                <input
                  type="text"
                  name="servingSize"
                  value={newFoodItem.servingSize || ''}
                  onChange={handleFoodItemChange}
                  placeholder="e.g., 100g, 1 cup"
                />
              </div>
              <div className="form-group">
                <label>Calories</label>
                <input
                  type="number"
                  name="calories"
                  min="0"
                  step="1"
                  value={newFoodItem.calories || ''}
                  onChange={handleFoodItemChange}
                />
              </div>
              <div className="form-group">
                <label>Protein (g)</label>
                <input
                  type="number"
                  name="protein"
                  min="0"
                  step="0.1"
                  value={newFoodItem.protein || ''}
                  onChange={handleFoodItemChange}
                />
              </div>
              <div className="form-group">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  name="carbs"
                  min="0"
                  step="0.1"
                  value={newFoodItem.carbs || ''}
                  onChange={handleFoodItemChange}
                />
              </div>
              <div className="form-group">
                <label>Fat (g)</label>
                <input
                  type="number"
                  name="fat"
                  min="0"
                  step="0.1"
                  value={newFoodItem.fat || ''}
                  onChange={handleFoodItemChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setIsAddingFoodItem(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleAddFoodItem}
                disabled={!newFoodItem.name}
                className="btn-save"
              >
                Add to Meal
              </button>
            </div>
          </div>
        )}
        
        {meal.foodItems.length > 0 ? (
          <ul className="food-items-list">
            {meal.foodItems.map((item, index) => (
              <li key={item.id || `${item.name}-${index}`} className="food-item">
                <div className="food-item-header">
                  <h3>{item.name}</h3>
                  <div className="food-item-actions">
                    <span className="food-item-quantity">
                      {item.quantity} {item.servingSize ? `x ${item.servingSize}` : ''}
                    </span>
                    {!isEditing && (
                      <button 
                        onClick={() => handleRemoveFoodItem(item.id || '')} 
                        className="btn-icon btn-remove"
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
                <div className="food-item-nutrition">
                  <div className="nutrition-item">
                    <span className="value">{Math.round(item.calories * item.quantity)}</span>
                    <span className="label">Calories</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="value">{Math.round(item.protein * item.quantity * 10) / 10}<span className="unit">g</span></span>
                    <span className="label">Protein</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="value">{Math.round(item.carbs * item.quantity * 10) / 10}<span className="unit">g</span></span>
                    <span className="label">Carbs</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="value">{Math.round(item.fat * item.quantity * 10) / 10}<span className="unit">g</span></span>
                    <span className="label">Fat</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-items">No food items found for this meal. Click "Add Food Item" to get started.</p>
        )}
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default MealDetailPage;
