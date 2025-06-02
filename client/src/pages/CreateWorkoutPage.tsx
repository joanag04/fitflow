import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Define a basic structure for workout data - can be expanded
interface ExerciseInput {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface WorkoutFormData {
  title: string;
  date: string;
  notes?: string;
  exercises: ExerciseInput[];
  completed: boolean;
}

const CreateWorkoutPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId?: string }>(); // workoutId is optional
  const navigate = useNavigate();
  const [formData, setFormData] = useState<WorkoutFormData>({
    title: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
    exercises: [],
    completed: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!workoutId;

  useEffect(() => {
    if (isEditMode && workoutId) {
      setLoading(true);
      api.get(`/workouts/${workoutId}`)
        .then(response => {
          const workout = response.data;
          // Transform data to fit WorkoutFormData if necessary
          setFormData({
            title: workout.title,
            date: new Date(workout.date).toISOString().split('T')[0],
            notes: workout.notes || '',
            exercises: workout.exercises.map((ex: any) => ({ // Map fetched exercises
              name: ex.name,
              sets: ex.sets.length, // Or however sets/reps/weight are structured
              reps: ex.sets[0]?.reps || 0, 
              weight: ex.sets[0]?.weight || 0,
            })),
            completed: workout.completed || false,
          });
        })
        .catch(err => {
          console.error('Failed to fetch workout for editing:', err);
          setError('Failed to load workout data. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [workoutId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExerciseChange = (index: number, field: keyof ExerciseInput, value: string | number) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setFormData(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: 10, weight: 0 }],
    }));
  };

  const removeExercise = (index: number) => {
    const updatedExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.title || !formData.date) {
        setError('Title and Date are required.');
        setLoading(false);
        return;
    }

    try {
      if (isEditMode) {
        await api.put(`/workouts/${workoutId}`, formData);
        alert('Workout updated successfully!');
      } else {
        await api.post('/workouts', formData);
        alert('Workout created successfully!');
      }
      navigate('/workouts'); // Navigate back to workouts list
    } catch (err: any) {
      console.error('Failed to save workout:', err);
      setError(err.response?.data?.message || 'Failed to save workout. Please try again.');
    }
    setLoading(false);
  };

  if (loading && isEditMode) return <p>Loading workout data...</p>;

  return (
    <div className="container create-workout-page">
      <h2>{isEditMode ? 'Edit Workout' : 'Create New Workout'}</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="date">Date:</label>
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="notes">Notes (Optional):</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}></textarea>
        </div>
        
        <h3>Exercises</h3>
        {formData.exercises.map((ex, index) => (
          <div key={index} className="exercise-input">
            <input type="text" placeholder="Exercise Name" value={ex.name} onChange={(e) => handleExerciseChange(index, 'name', e.target.value)} />
            <input type="number" placeholder="Sets" value={ex.sets} onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))} />
            <input type="number" placeholder="Reps" value={ex.reps} onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))} />
            <input type="number" placeholder="Weight (kg)" value={ex.weight} onChange={(e) => handleExerciseChange(index, 'weight', parseFloat(e.target.value))} />
            <button type="button" onClick={() => removeExercise(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addExercise}>Add Exercise</button>

        <div>
          <label htmlFor="completed">Completed:</label>
          <input type="checkbox" id="completed" name="completed" checked={formData.completed} onChange={handleChange} />
        </div>

        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Workout'}</button>
      </form>
    </div>
  );
};

export default CreateWorkoutPage;
