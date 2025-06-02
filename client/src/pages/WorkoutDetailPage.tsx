import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Workout, Exercise, Set } from './WorkoutsPage'; // Assuming types are exported from WorkoutsPage
import './WorkoutDetailPage.css';
import api from '../services/api'; // Import api service for making requests // We'll create this CSS file next

const WorkoutDetailPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!workoutId) return;
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token'); // Note: api.ts now handles token injection
      // The fetchWorkoutDetails was previously using fetch directly with manual token handling.
      // It should be updated to use the `api` service for consistency and automatic token injection.
      // For now, leaving as is to focus on the import error, but this is a TODO.
      if (!token && !api.defaults.headers.common['Authorization']) { // Check if token isn't set by api.ts either
        setError('Authentication required.');
        setLoading(false);
        return;
      }

      try {
        // Using the global fetch here; consider switching to `api.get` for consistency
        const response = await fetch(`/api/workouts/${workoutId}`, {
          headers: {
            // Authorization header will be added by api.ts interceptor if using api.get
            // If using global fetch, manual addition is needed or rely on api.ts's default for other calls.
            ...(token && !api.defaults.headers.common['Authorization'] ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        const data: Workout = await response.json();
        setWorkout(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch workout details.');
      }
      setLoading(false);
    };

    fetchWorkoutDetails();
  }, [workoutId]);

  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <div className="container page-loading">Loading workout details...</div>;
  if (error) return <p className="error-message">Error loading workout: {error}</p>;
  if (!workout) return <p>Workout not found.</p>;

  const handleEdit = () => {
    navigate(`/workouts/edit/${workoutId}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await api.delete(`/workouts/${workoutId}`); // This correctly uses the api service
        alert('Workout deleted successfully!');
        navigate('/workouts'); // Navigate back to the workouts list
      } catch (err: any) {
        console.error('Failed to delete workout:', err);
        setError(err.response?.data?.message || 'Failed to delete workout. Please try again.');
        alert('Error deleting workout: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="workout-detail-page-container">
      <header className="workout-detail-header">
        <h1>{workout.title}</h1>
        <p className="workout-date"><strong>Date:</strong> {formatDate(workout.date)}</p>
        {workout.completed && <span className="status-completed">Completed ✅</span>}
      </header>

      <section className="workout-summary">
        {workout.duration > 0 && <p><strong>Duration:</strong> {workout.duration} minutes</p>}
        {workout.notes && <p><strong>Notes:</strong> {workout.notes}</p>}
      </section>

      <section className="workout-exercises-detail">
        <h2>Exercises</h2>
        {workout.exercises.length > 0 ? (
          <ul>
            {workout.exercises.map((exercise: Exercise, exIndex: number) => (
              <li key={exIndex} className="exercise-item-detail">
                <h3>{exercise.name}</h3>
                {exercise.notes && <p className="exercise-notes">Notes: {exercise.notes}</p>}
                {exercise.sets.length > 0 ? (
                  <ul className="sets-list-detail">
                    {exercise.sets.map((set: Set, setIndex: number) => (
                      <li key={setIndex} className={`set-item-detail ${set.completed ? 'set-completed' : ''}`}>
                        Set {setIndex + 1}: Weight: {set.weight} kg, Reps: {set.reps} {set.completed ? '(Completed)' : '(Not Completed)'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No sets logged for this exercise.</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No exercises logged for this workout.</p>
        )}
      </section>
      <div className="workout-detail-actions">
        <button onClick={handleEdit} className="button-edit">
          Edit Workout
        </button>
        <button onClick={handleDelete} className="button-delete">
          Delete Workout
        </button>
      </div>
    </div>
  );
};

export default WorkoutDetailPage;
