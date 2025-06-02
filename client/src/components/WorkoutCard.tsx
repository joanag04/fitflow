import React from 'react';
import { Link } from 'react-router-dom';
import type { Workout } from '../pages/WorkoutsPage'; // Import Workout and Exercise interfaces
import './WorkoutCard.css';

interface WorkoutCardProps {
  workout: Workout & { _id?: string }; // Ensure _id is available for linking
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout }) => {
  console.log('[WorkoutCard] Rendering card for workout:', JSON.stringify(workout, null, 2));
  console.log('[WorkoutCard] Workout ID for link:', workout._id);
  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/workouts/${workout._id}`} className="workout-card-link" onClick={() => console.log(`[WorkoutCard] Link clicked. Navigating to: /workouts/${workout._id}`)}>
      <div className="workout-card">
      <h3 className="workout-card-title">
        {workout.title}
        {workout.completed && <span className="completion-checkmark" title="Completed"> ✅</span>}
      </h3>
      <p className="workout-card-date"><strong>Date:</strong> {formatDate(workout.date)}</p>
      {workout.duration > 0 && (
        <p className="workout-card-duration"><strong>Duration:</strong> {workout.duration} minutes</p>
      )}
      {/* Add a View Details button/link here later if needed */}
      </div>
    </Link>
  );
};

export default WorkoutCard;
