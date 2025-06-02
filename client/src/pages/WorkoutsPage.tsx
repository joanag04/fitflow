import React, { useState, useEffect } from 'react';
import './WorkoutsPage.css';
import WorkoutCard from '../components/WorkoutCard'; // Import WorkoutCard

// Define interfaces for Workout, Exercise, and Set
export interface Set {
  // setId: string; // Or generate on client before sending? For now, array index is fine.
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  // exerciseId: string;
  name: string;
  sets: Set[];
  notes?: string;
}

export interface Workout {
  // workoutId?: string; // From MongoDB
  userId?: string; // Will come from auth context later, used for backend POST
  title: string;
  date: string; // Store as ISO string (e.g., YYYY-MM-DD)
  exercises: Exercise[];
  duration: number; // in minutes
  notes?: string;
  completed: boolean;
}

const WorkoutsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [duration, setDuration] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [displayedWorkouts, setDisplayedWorkouts] = useState<Workout[]>([]); // State for workouts to display
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setDisplayedWorkouts([]); // Clear workouts if no token (user logged out)
        console.log('[WorkoutsPage] No token found, clearing displayed workouts.');
        return;
      }

      try {
        console.log('[WorkoutsPage] Fetching workouts...');
        const response = await fetch('/api/workouts', { // GET request to fetch workouts
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache', // For HTTP/1.0 compatibility
            'Expires': '0' // For proxies
          },
        });

        if (!response.ok) {
          let errorMsg = 'Failed to fetch workouts.';
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || `Error: ${response.status}`;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(errorMsg);
        }

        const workoutsData: Workout[] = await response.json();
        setDisplayedWorkouts(workoutsData);
        console.log('[WorkoutsPage] Workouts fetched successfully:', workoutsData);
      } catch (error: any) {
        console.error('Error fetching workouts:', error);
        // Optionally set an error message to display to the user
        // setFormError(error.message || 'Failed to load your workouts.'); 
        setDisplayedWorkouts([]); // Clear workouts on error
      }
    };

    fetchWorkouts();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { name: '', sets: [{ weight: 0, reps: 0, completed: false }], notes: '' },
    ]);
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setExercises(exercises.filter((_, index) => index !== exerciseIndex));
  };

  const handleExerciseChange = (
    exerciseIndex: number,
    field: keyof Omit<Exercise, 'sets'>,
    value: string
  ) => {
    const updatedExercises = exercises.map((exercise, index) => {
      if (index === exerciseIndex) {
        return { ...exercise, [field]: value };
      }
      return exercise;
    });
    setExercises(updatedExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = exercises.map((exercise, exIdx) => {
      if (exIdx === exerciseIndex) {
        return {
          ...exercise,
          sets: [...exercise.sets, { weight: 0, reps: 0, completed: false }],
        };
      }
      return exercise;
    });
    setExercises(updatedExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = exercises.map((exercise, exIdx) => {
      if (exIdx === exerciseIndex) {
        return {
          ...exercise,
          sets: exercise.sets.filter((_, sIdx) => sIdx !== setIndex),
        };
      }
      return exercise;
    });
    setExercises(updatedExercises);
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof Set,
    value: string | number | boolean
  ) => {
    const updatedExercises = exercises.map((exercise, exIdx) => {
      if (exIdx === exerciseIndex) {
        const updatedSets = exercise.sets.map((set, sIdx) => {
          if (sIdx === setIndex) {
            return { ...set, [field]: value };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    setExercises(updatedExercises);
  };

  const handleSaveWorkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Read from localStorage immediately
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    // Log the values immediately after retrieval
    console.log('[handleSaveWorkout] Raw token from localStorage:', token);
    console.log('[handleSaveWorkout] Raw userString from localStorage:', userString);

    // Set loading state and clear previous errors
    setIsSubmitting(true);
    setFormError('');

    // Authentication Check (early)
    if (!token || !userString) {
      setFormError('You must be logged in to save a workout. Missing token or user info. (Early Check)');
      setIsSubmitting(false);
      return;
    }

    // Basic form field validation
    if (!title.trim()) {
      setFormError('Workout Title is required.');
      setIsSubmitting(false);
      return;
    }
    if (exercises.length === 0) {
      setFormError('At least one exercise is required.');
      setIsSubmitting(false);
      return;
    }
    for (const exercise of exercises) {
      if (!exercise.name.trim()) {
        setFormError('All exercises must have a name.');
        setIsSubmitting(false);
        return;
      }
    }

    let userId;
    try {
      // First try to get user from localStorage
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('No user data found in localStorage');
      }
      
      const parsedUser = JSON.parse(userString);
      userId = parsedUser?._id || parsedUser?.id; // Check both _id and id
      
      if (!userId) {
        // If still no user ID, try to get it from the token
        const token = localStorage.getItem('token');
        if (token) {
          // If we have a token, we can extract the user ID from it
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.id || payload.userId;
            } catch (e) {
              console.error('Error parsing token payload:', e);
            }
          }
        }
        
        if (!userId) {
          throw new Error('User ID not found in stored user data or token.');
        }
      }
    } catch (parseError) {
      console.error('Error getting user ID:', parseError);
      setFormError('Error processing user data. Please try logging out and back in.');
      setIsSubmitting(false);
      return;
    }

    const workoutData: Workout = {
      userId: userId,
      title,
      date,
      exercises,
      duration,
      notes: workoutNotes,
      completed: isWorkoutCompleted,
    };

    console.log('Submitting workout data:', workoutData);
    console.log('Auth token:', token ? token.substring(0, 20) + '...' : 'No token found early');

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workoutData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} - ${responseData.message || response.statusText}`;
        if (responseData.errors) {
          errorMessage += `\nDetails: ${responseData.errors.map((err: any) => err.msg).join(', ')}`;
        }
        throw new Error(errorMessage);
      }

      console.log('Workout saved successfully:', responseData);
      setDisplayedWorkouts(prevWorkouts => [responseData, ...prevWorkouts]);
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setDuration(0);
      setWorkoutNotes('');
      setIsWorkoutCompleted(false);
      setExercises([]);
      setShowWorkoutForm(false);
      alert('Workout saved successfully!');

    } catch (error: any) {
      console.error('Error saving workout:', error);
      setFormError(error.message || 'An unexpected error occurred while saving the workout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workouts-page-container">
      {!showWorkoutForm ? (
        // View for displaying existing workouts and "Log New Workout" button
        <div className="workouts-overview">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 className="page-title">Your Workouts</h1>
            <button onClick={() => setShowWorkoutForm(true)} className="btn-primary" disabled={isSubmitting}>
              Log New Workout
            </button>
          </div>
          {displayedWorkouts.length === 0 ? (
            <p>No workouts logged yet. Click "Log New Workout" to add one!</p>
          ) : (
            <div className="workouts-list">
              {displayedWorkouts.map((workout, index) => (
                <WorkoutCard key={workout.userId && workout.date ? `${workout.userId}-${workout.date}-${index}` : `${index}-${new Date().getTime()}`} workout={workout} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // View for the workout logging form
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 className="page-title">Log New Workout</h1>
            <button onClick={() => setShowWorkoutForm(false)} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
          </div>
          <form onSubmit={handleSaveWorkout} className="workout-form">
            <div className="form-group">
              <label htmlFor="workout-title">Workout Title</label>
              <input
                type="text"
                id="workout-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="workout-date">Date</label>
              <input
                type="date"
                id="workout-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="workout-duration">Duration (minutes)</label>
              <input
                type="number"
                id="workout-duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                min="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="workout-notes">Workout Notes (optional)</label>
              <textarea
                id="workout-notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="workout-completed"
                checked={isWorkoutCompleted}
                onChange={(e) => setIsWorkoutCompleted(e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="workout-completed">Workout Completed</label>
            </div>

            <div className="exercises-section">
              <h2>Exercises</h2>
              {exercises.map((exercise, exerciseIndex) => (
                <div key={`exercise-${exerciseIndex}`} className="exercise-item">
                  <div className="form-group">
                    <label htmlFor={`exercise-name-${exerciseIndex}`}>Exercise Name</label>
                    <input
                      type="text"
                      id={`exercise-name-${exerciseIndex}`}
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'name', e.target.value)}
                      placeholder="e.g., Bench Press"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`exercise-notes-${exerciseIndex}`}>Exercise Notes (optional)</label>
                    <textarea
                      id={`exercise-notes-${exerciseIndex}`}
                      value={exercise.notes || ''}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'notes', e.target.value)}
                      placeholder="e.g., 30s rest between sets"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="sets-section">
                    <h3>Sets</h3>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={`exercise-${exerciseIndex}-set-${setIndex}`} className="set-item">
                        <div className="form-group">
                          <label htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}>Weight (kg)</label>
                          <input
                            type="number"
                            id={`set-weight-${exerciseIndex}-${setIndex}`}
                            value={set.weight}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}>Reps</label>
                          <input
                            type="number"
                            id={`set-reps-${exerciseIndex}-${setIndex}`}
                            value={set.reps}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="checkbox-group set-completed-group">
                          <input
                            type="checkbox"
                            id={`set-completed-${exerciseIndex}-${setIndex}`}
                            checked={set.completed}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'completed', e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <label htmlFor={`set-completed-${exerciseIndex}-${setIndex}`}>Done</label>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSet(exerciseIndex, setIndex)} 
                          className="btn-danger btn-small"
                          disabled={isSubmitting}
                        >
                          Remove Set
                        </button>
                      </div>
                    ))}
                    {exercise.sets.length === 0 && <p>No sets added for this exercise.</p>}
                    <button 
                      type="button" 
                      onClick={() => handleAddSet(exerciseIndex)} 
                      className="btn-secondary btn-small"
                      style={{marginTop: '0.5rem'}}
                      disabled={isSubmitting}
                    >
                      Add Set
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveExercise(exerciseIndex)} 
                    className="btn-danger"
                    style={{marginTop: '1rem'}}
                    disabled={isSubmitting}
                  >
                    Remove Exercise
                  </button>
                </div>
              ))}
              {exercises.length === 0 && <p>No exercises added yet. Click "Add Exercise" to begin.</p>}
              <button type="button" onClick={handleAddExercise} className="btn-secondary" style={{marginTop: '1rem'}} disabled={isSubmitting}>
                Add Exercise
              </button>
            </div>

            <div className="actions-group">
              {formError && <p className="form-error-message">{formError}</p>}
              <button type="submit" className="btn-primary submit-workout-button" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Workout'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkoutsPage;
