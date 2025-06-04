import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Dumbbell } from 'lucide-react';
import type { Workout } from '../pages/WorkoutsPage';
import './WorkoutCard.css';

interface WorkoutCardProps {
  workout: Workout & { _id?: string };
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout }) => {
  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get unique exercise names for the tags
  const exerciseTags = Array.from(
    new Set(workout.exercises.map(ex => ex.name).filter(Boolean))
  ).slice(0, 4); // Limit to 4 exercises for the card

  return (
    <article className="workout-card-container">
      <Link 
        to={`/workouts/${workout._id}`} 
        className="workout-card-link"
        aria-label={`View ${workout.title} workout details`}
      >
        <div className="workout-card">
          <header className="workout-card-header">
            <h3 className="workout-card-title">
              {workout.title}
              {workout.completed && (
                <span className="completion-checkmark" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </span>
              )}
            </h3>
          </header>
          
          <div className="workout-card-meta">
            <div className="workout-card-date">
              <Calendar size={16} aria-hidden="true" />
              <time dateTime={new Date(workout.date).toISOString().split('T')[0]}>
                {formatDate(workout.date)}
              </time>
            </div>
            
            {workout.duration > 0 && (
              <div className="workout-card-duration">
                <Clock size={16} aria-hidden="true" />
                <span>{workout.duration} minutes</span>
              </div>
            )}
          </div>

          {exerciseTags.length > 0 && (
            <div className="workout-card-exercises">
              <h4>
                <Dumbbell size={16} aria-hidden="true" />
                <span>Exercises</span>
              </h4>
              <ul>
                {exerciseTags.map((exercise, index) => (
                  <li key={index} title={exercise}>
                    {exercise}
                  </li>
                ))}
                {workout.exercises.length > 4 && (
                  <li>+{workout.exercises.length - 4} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};

export default WorkoutCard;
