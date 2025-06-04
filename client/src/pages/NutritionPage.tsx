import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NutritionLogOptionsMenu from '../components/NutritionLogOptionsMenu';
import './NutritionPage.css';

// Define interfaces locally for now
export interface FoodItem {
  id?: string; // Client-side only for React keys
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  quantity: number;
}

export interface Meal {
  id?: string; // Client-side only for React keys
  name: string;
  time: string;
  foodItems: FoodItem[];
  waterIntake?: number; // Track water intake for the meal
}

export interface NutritionLog {
  id?: string;
  userId?: string;
  date: string;
  meals: Meal[];
  totalCalories?: number;
  totalProtein?: number; // Added
  totalCarbs?: number;   // Added
  totalFat?: number;     // Added
  waterIntake?: number; // Added (was in payload, now also for display)
  notes?: string;
}

// Mock data removed, will fetch from backend

const NutritionPage: React.FC = () => {
  const [isFetchingLogs, setIsFetchingLogs] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState(false);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]); // Initialize with empty array
  
  // Form State
  const [currentLogDate, setCurrentLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentLogNotes, setCurrentLogNotes] = useState<string>('');
  const [currentMeals, setCurrentMeals] = useState<Meal[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Helper to generate unique IDs for local state management
  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 15);

  // Meal Management Handlers
  const handleAddMeal = () => {
    setCurrentMeals([...currentMeals, { id: generateId(), name: '', time: '', foodItems: [] }]);
  };

  const handleRemoveMeal = (mealIdToRemove: string) => {
    setCurrentMeals(currentMeals.filter(meal => meal.id !== mealIdToRemove));
  };

  const handleMealInputChange = (mealId: string, field: keyof Pick<Meal, 'name' | 'time'>, value: string) => {
    setCurrentMeals(currentMeals.map(meal => 
      meal.id === mealId ? { ...meal, [field]: value } : meal
    ));
  };

  // Food Item Management Handlers
  const handleAddFoodItem = (mealId: string) => {
    setCurrentMeals(currentMeals.map(meal => {
      if (meal.id === mealId) {
        const newFoodItem: FoodItem = {
          id: generateId(), // Client-side ID
          name: '',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          servingSize: ''
        };
        return { ...meal, foodItems: [...(meal.foodItems || []), newFoodItem] };
      }
      return meal;
    }));
  };

  const handleRemoveFoodItem = (mealId: string, foodItemIdToRemove: string) => {
    setCurrentMeals(currentMeals.map(meal => {
      if (meal.id === mealId) {
        return { ...meal, foodItems: (meal.foodItems || []).filter(item => item.id !== foodItemIdToRemove) };
      }
      return meal;
    }));
  };

  const handleFoodItemInputChange = (
    mealId: string, 
    foodItemId: string, 
    field: keyof Omit<FoodItem, 'id'>, 
    value: string | number
  ) => {
    setCurrentMeals(currentMeals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foodItems: (meal.foodItems || []).map(item => {
            if (item.id === foodItemId) {
              // Convert to number if the field is numeric
              const numericFields: (keyof Omit<FoodItem, 'id' | 'name' | 'servingSize'>)[] = ['calories', 'protein', 'carbs', 'fat', 'quantity'];
              const processedValue = numericFields.includes(field as any) ? Number(value) : value;
              return { ...item, [field]: processedValue };
            }
            return item;
          })
        };
      }
      return meal;
    }));
  };

  const resetForm = () => {
    setCurrentLogDate(new Date().toISOString().split('T')[0]);
    setCurrentLogNotes('');
    setCurrentMeals([]);
    setFormError(null);
  };

  const handleSubmitLog = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setIsLoading(true);

    if (!currentLogDate) {
      setFormError('Log date is required.');
      return;
    }
    if (currentMeals.length === 0) {
      setFormError('At least one meal is required to log nutrition.');
      return;
    }
    for (const meal of currentMeals) {
      if (!meal.name.trim()) {
        setFormError(`Meal name is required for all meals.`);
        return;
      }
      if (!meal.time.trim()) {
        setFormError(`Meal time is required for meal: ${meal.name}.`);
        return;
      }
      // Validate food items within each meal
      if (!meal.foodItems || meal.foodItems.length === 0) {
        setFormError(`At least one food item is required for meal: ${meal.name}.`);
        return;
      }
      for (const item of meal.foodItems) {
        if (!item.name.trim()) {
          setFormError(`Food item name is required in meal: ${meal.name}.`);
          return;
        }
        if (item.quantity <= 0) {
          setFormError(`Quantity must be greater than 0 for ${item.name} in meal: ${meal.name}.`);
          return;
        }
        if (item.calories < 0 || item.protein < 0 || item.carbs < 0 || item.fat < 0) {
          setFormError(`Nutritional values cannot be negative for ${item.name} in meal: ${meal.name}.`);
          return;
        }
      }
    }

    // Prepare payload for the backend
    const payload = {
      date: currentLogDate,
      meals: currentMeals.map(meal => {
        // Combine currentLogDate (YYYY-MM-DD) and meal.time (HH:MM) into a full ISO string
        const mealDateTime = new Date(`${currentLogDate}T${meal.time}:00Z`); // Assume UTC for consistency, or handle timezone as needed
        return {
          name: meal.name,
          time: mealDateTime.toISOString(), // Backend expects a Date (ISO string is fine)
          foodItems: (meal.foodItems || []).map(({ id, ...itemData }) => itemData) // Remove client-side id from foodItems
        };
      }),
      notes: currentLogNotes.trim() || undefined,
      // waterIntake could be added here if a form field exists
    };

    const submitData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setFormError('Authentication token not found. Please login.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/nutrition', { // Vite proxy handles the full URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Use message from backend if available, otherwise a generic one
          throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('Nutrition log added successfully:', responseData);
        // alert('Nutrition log added successfully!'); // Optional: user feedback
        setShowForm(false);
        resetForm();
        fetchLogForDate(currentLogDate); // Refresh logs for the current date

      } catch (error: any) {
        console.error('Failed to submit nutrition log:', error);
        setFormError(error.message || 'Failed to submit nutrition log. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    submitData();
  };

  // Function to fetch nutrition log for a specific date
  const fetchLogForDate = async (dateToFetch: string) => {
    setIsFetchingLogs(true);
    setFormError(null); // Clear previous errors
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('Authentication token not found. Please login.');
        setNutritionLogs([]); // Clear logs if not authenticated
        return;
      }

      const response = await fetch(`/api/nutrition/${dateToFetch}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        setNutritionLogs([]); // No log found for this date
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: NutritionLog = await response.json();
      // Backend returns a single log object, map _id to id for frontend consistency if needed by display components
      // For now, assuming display components can handle _id or the interface is aligned.
      // The backend schema has _id, and our INutrition in controller returns the direct model.
      // Let's map _id to id for frontend state to match existing FoodItem/Meal client-side id usage. 
      const formattedLog = {
        ...data,
        id: (data as any)._id || data.id, // Handle if _id exists from backend
        meals: data.meals.map(meal => ({
            ...meal,
            // foodItems don't have _id from backend as they are subdocs without it
        })),
      };
      setNutritionLogs([formattedLog]); // Display the single fetched log

    } catch (error: any) {
      console.error('Failed to fetch nutrition log:', error);
      setFormError(error.message || 'Failed to fetch nutrition log.');
      setNutritionLogs([]); // Clear logs on error
    } finally {
      setIsFetchingLogs(false);
    }
  };

  // Function to delete a nutrition log
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Are you sure you want to delete this nutrition log? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('Authentication token not found. Please login.');
        return;
      }

      const response = await fetch(`/api/nutrition/logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete nutrition log');
      }

      // Refresh the logs for the current date
      fetchLogForDate(currentLogDate);
    } catch (error: any) {
      console.error('Failed to delete nutrition log:', error);
      setFormError(error.message || 'Failed to delete nutrition log. Please try again.');
    }
  };

  // useEffect to fetch log when component mounts or currentLogDate changes
  useEffect(() => {
    if (currentLogDate) {
      fetchLogForDate(currentLogDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogDate]); // Dependency: currentLogDate

  return (
    <div className="nutrition-page-container">
      {/* Date selection for viewing logs - this affects currentLogDate */}
      <div className="date-selector-container" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <label htmlFor="view-log-date" style={{ marginRight: '10px', fontSize: '1.1em' }}>Select Date to View/Log:</label>
        <input 
          type="date" 
          id="view-log-date" 
          value={currentLogDate} 
          onChange={(e) => setCurrentLogDate(e.target.value)} 
          required 
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          disabled={isLoading || isFetchingLogs} // Disable if any loading is active
        />
      </div>

      {/* Global loading and error messages */}
      {isFetchingLogs && <p className="loading-message" style={{ textAlign: 'center', color: 'blue' }}>Loading nutrition data for {new Date(currentLogDate + 'T00:00:00Z').toLocaleDateString()}...</p>}
      {/* General formError (not specific to form submission) is shown in view mode if it occurred during fetch */}

      {!showForm ? (
        // VIEWING LOGS MODE
        <div className="nutrition-overview">
          <div className="page-header">
            <h1 className="page-title">Nutrition Log for {new Date(currentLogDate + 'T00:00:00Z').toLocaleDateString()}</h1>
            <button 
              onClick={() => { 
                setShowForm(true); 
                setFormError(null); /* Clear old errors when switching to form */ 
              }} 
              className="btn-primary" 
              disabled={isFetchingLogs || isLoading}
            >
              Log New Nutrition
            </button>
          </div>

          {/* Display error message if it occurred during fetching logs AND we are not currently fetching */}
          {formError && !isFetchingLogs && <p className="error-message" style={{textAlign: 'center', color: 'red'}}>{formError}</p>}

          {!isFetchingLogs && !formError && nutritionLogs.length === 0 && (
            <div className="no-logs-message" style={{ textAlign: 'center', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
              <p>No nutrition log found for {new Date(currentLogDate + 'T00:00:00Z').toLocaleDateString()}.</p>
              <p>Click "Log New Nutrition for this Date" to add an entry.</p>
            </div>
          )}

          {!isFetchingLogs && !formError && nutritionLogs.length > 0 && (
            <div className="nutrition-logs-list">
              {nutritionLogs.map((log) => (
                <div key={log.id || (log as any)._id || log.date} className="nutrition-log-card">
                  <div className="nutrition-log-card-header">
                    <h3>Log Details for {new Date(log.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                  </div>

                  <div className="nutrition-log-summary">
                    <div className="summary-item"><strong>Total Calories:</strong> <span>{log.totalCalories === undefined || log.totalCalories === null ? 'N/A' : `${log.totalCalories} kcal`}</span></div>
                    {/* Display other totals if available from backend */}
                    {log.totalProtein !== undefined && <div className="summary-item"><strong>Total Protein:</strong> <span>{log.totalProtein}g</span></div>}
                    {log.totalCarbs !== undefined && <div className="summary-item"><strong>Total Carbs:</strong> <span>{log.totalCarbs}g</span></div>}
                    {log.totalFat !== undefined && <div className="summary-item"><strong>Total Fat:</strong> <span>{log.totalFat}g</span></div>}
                    {log.waterIntake !== undefined && <div className="summary-item"><strong>Water Intake:</strong> <span>{log.waterIntake}ml</span></div>}
                  </div>

                  <div className="nutrition-log-card-footer">
                    <Link to={`/nutrition/logs/${log.id || log.date}`} className="btn-link view-details-btn">
                      View Details &gt;
                    </Link>
                    <NutritionLogOptionsMenu 
                      logId={log.id || log.date} 
                      onDelete={() => handleDeleteLog(log.id || log.date)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // LOGGING FORM MODE
        <div>
          <div className="page-header">
            <h1 className="page-title">Log Nutrition for {new Date(currentLogDate + 'T00:00:00Z').toLocaleDateString()}</h1>
            <button onClick={() => { setShowForm(false); setFormError(null); /* Clear form errors */ }} className="btn-secondary" disabled={isLoading}>
              Cancel
            </button>
          </div>

          {formError && <p className="form-error" style={{ color: 'red', textAlign: 'center' }}>{formError}</p>} {/* Form-specific errors */}
          
          <form onSubmit={handleSubmitLog} className="nutrition-form">
            <div className="form-group">
              <label htmlFor="log-notes">Notes (Optional)</label>
              <textarea id="log-notes" value={currentLogNotes} onChange={(e) => setCurrentLogNotes(e.target.value)} rows={3} disabled={isLoading} />
            </div>

            <div className="meals-section">
              <h4>Meals</h4>
              {currentMeals.map((meal) => (
                <div key={meal.id} className="meal-entry">
                  <div className="meal-header">
                    <div className="form-group meal-name-group">
                      <label htmlFor={`meal-name-${meal.id!}`}>Meal Name</label>
                      <input type="text" id={`meal-name-${meal.id!}`} placeholder="e.g., Breakfast" value={meal.name} onChange={(e) => handleMealInputChange(meal.id!, 'name', e.target.value)} required disabled={isLoading} />
                    </div>
                    <div className="form-group meal-time-group">
                      <label htmlFor={`meal-time-${meal.id!}`}>Time</label>
                      <input type="time" id={`meal-time-${meal.id!}`} value={meal.time} onChange={(e) => handleMealInputChange(meal.id!, 'time', e.target.value)} required disabled={isLoading} />
                    </div>
                  </div>
                  
                  <div className="food-items-section">
                    <h5>Food Items for {meal.name || 'this meal'}</h5>
                    {(meal.foodItems || []).map((item) => (
                      <div key={item.id} className="food-item-entry">
                        <div className="form-group"><label htmlFor={`food-name-${meal.id!}-${item.id!}`}>Food Name</label><input type="text" id={`food-name-${meal.id!}-${item.id!}`} value={item.name} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'name', e.target.value)} required placeholder="e.g., Apple" disabled={isLoading} /></div>
                        <div className="form-group-inline">
                          <div className="form-group"><label htmlFor={`food-cal-${meal.id!}-${item.id!}`}>Calories</label><input type="number" id={`food-cal-${meal.id!}-${item.id!}`} value={item.calories} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'calories', e.target.value)} required min="0" disabled={isLoading} /></div>
                          <div className="form-group"><label htmlFor={`food-prot-${meal.id!}-${item.id!}`}>Protein (g)</label><input type="number" id={`food-prot-${meal.id!}-${item.id!}`} value={item.protein} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'protein', e.target.value)} required min="0" disabled={isLoading} /></div>
                          <div className="form-group"><label htmlFor={`food-carb-${meal.id!}-${item.id!}`}>Carbs (g)</label><input type="number" id={`food-carb-${meal.id!}-${item.id!}`} value={item.carbs} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'carbs', e.target.value)} required min="0" disabled={isLoading} /></div>
                          <div className="form-group"><label htmlFor={`food-fat-${meal.id!}-${item.id!}`}>Fat (g)</label><input type="number" id={`food-fat-${meal.id!}-${item.id!}`} value={item.fat} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'fat', e.target.value)} required min="0" disabled={isLoading} /></div>
                          <div className="form-group"><label htmlFor={`food-qty-${meal.id!}-${item.id!}`}>Quantity</label><input type="number" id={`food-qty-${meal.id!}-${item.id!}`} value={item.quantity} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'quantity', e.target.value)} required min="1" disabled={isLoading} /></div>
                          <div className="form-group"><label htmlFor={`food-serv-${meal.id!}-${item.id!}`}>Serving Size</label><input type="text" id={`food-serv-${meal.id!}-${item.id!}`} value={item.servingSize || ''} onChange={(e) => handleFoodItemInputChange(meal.id!, item.id!, 'servingSize', e.target.value)} placeholder="e.g., 1 cup" disabled={isLoading} /></div>
                        </div>
                        <button type="button" onClick={() => handleRemoveFoodItem(meal.id!, item.id!)} className="btn-danger btn-small" disabled={isLoading}>Remove Food Item</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddFoodItem(meal.id!)} className="btn-secondary btn-small" disabled={isLoading}>Add Food Item</button>
                  </div>
                  <button type="button" onClick={() => handleRemoveMeal(meal.id!)} className="btn-danger" disabled={isLoading}>Remove Meal</button>
                </div>
              ))}
              <button type="button" onClick={handleAddMeal} className="btn-secondary" disabled={isLoading}>Add Meal</button>
            </div>

            <button type="submit" className="submit-log-button" disabled={isLoading}>{isLoading ? 'Submitting...' : 'Submit Log'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default NutritionPage;
