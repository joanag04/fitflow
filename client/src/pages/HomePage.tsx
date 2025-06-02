import React, { useState, useEffect } from 'react';

// Define LEVEL_THRESHOLDS locally as a workaround
interface LevelThreshold {
  level: number;
  pointsNeeded: number; // Total accumulated points to reach this level
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, pointsNeeded: 0 },
  { level: 2, pointsNeeded: 100 },
  { level: 3, pointsNeeded: 250 },
  { level: 4, pointsNeeded: 500 },
  { level: 5, pointsNeeded: 800 },
  { level: 6, pointsNeeded: 1200 },
  // Sentinel for max level calculation if needed, or rely on nextLevelPoints being Infinity
  { level: 7, pointsNeeded: Infinity } // Simplifies finding next level's points
];
import { Link } from 'react-router-dom';
import './HomePage.css'; // Assuming this file exists

// Client-side interface for User data (mirroring relevant backend IUser fields)
interface UserData {
  _id: string;
  name: string;
  email: string;
  level: number;
  points: number;
  nextLevelPoints: number;
  currentStreak: number;
  workoutsCompleted?: number; // Added, optional for older localStorage data
  mealsTracked?: number;    // Added, optional for older localStorage data
  // Add other fields from localStorage user object if needed
}

// Placeholder icons (can be kept or replaced)
const WorkoutIcon = () => <span>🏋️</span>;
const NutritionIcon = () => <span>🥗</span>;
const WeightIcon = () => <span>⚖️</span>;

const HomePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Attempt to get initial user info from localStorage for immediate display
      const localUserString = localStorage.getItem('user');
      if (localUserString) {
        try {
          setCurrentUser(JSON.parse(localUserString) as UserData);
        } catch (e) {
          console.warn('Could not parse local user data, fetching from server.');
        }
      }

      if (!token) {
        console.log('No token found, user is likely not logged in.');
        // If there's no token, we might rely on a pre-existing (but potentially stale) localStorage user object or show logged-out state.
        // For now, if no token, and localUserString was also null/invalid, currentUser remains null.
        // If localUserString was valid, it's already set.
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('User not authenticated, clearing local session.');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setCurrentUser(null);
          } else {
            console.error('Failed to fetch user data:', response.statusText);
            // Optionally, keep the localStorage data if API fails for other reasons
          }
          setLoading(false);
          return;
        }

        const data = await response.json() as UserData;
        setCurrentUser(data);
        // Update localStorage with the fresh data from the server
        localStorage.setItem('user', JSON.stringify(data)); 
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Keep potentially stale localStorage data if API call fails
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="home-page-container"><p>Loading...</p></div>; // Or a spinner component
  }

  return (
    <div className="home-page-container">
      {currentUser ? (
        <section className="welcome-gamification-section">
          <h1 className="page-title">Welcome back, {currentUser.name}!</h1>
          
          <div className="gamification-stats">
            <h2>Your Progress</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <strong>Level:</strong> {currentUser.level}
              </div>
              <div className="stat-item">
                <strong>Points:</strong> {
                  (() => {
                    const { level, points, nextLevelPoints: serverNextLevelPoints } = currentUser;

                    const currentLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === level);
                    const pointsAtCurrentLevelStart = currentLevelInfo ? currentLevelInfo.pointsNeeded : 0;

                    let resolvedNextLevelPoints: number;
                    if (typeof serverNextLevelPoints === 'number' && serverNextLevelPoints !== null) {
                        resolvedNextLevelPoints = serverNextLevelPoints;
                    } else {
                        // Fallback if serverNextLevelPoints is undefined/null (e.g. from stale localStorage)
                        const nextClientThreshold = LEVEL_THRESHOLDS.find(lt => lt.level === level + 1);
                        resolvedNextLevelPoints = nextClientThreshold ? nextClientThreshold.pointsNeeded : Infinity;
                    }

                    const pointsEarnedInCurrentLevel = points - pointsAtCurrentLevelStart;
                    const totalPointsForCurrentLevelSpan = resolvedNextLevelPoints - pointsAtCurrentLevelStart;

                    let pointsText = '';
                    let progressWidth = '0%';

                    if (resolvedNextLevelPoints === Infinity || totalPointsForCurrentLevelSpan <= 0) {
                      pointsText = `Max Level (${points} pts)`;
                      progressWidth = '100%';
                    } else if (totalPointsForCurrentLevelSpan === 0) { // Should ideally not happen with good data
                      pointsText = `${pointsEarnedInCurrentLevel} / ... (syncing)`;
                      progressWidth = '0%'; // Or 100% if we assume it means max for this interim state
                    } else {
                      pointsText = `${pointsEarnedInCurrentLevel} / ${totalPointsForCurrentLevelSpan}`;
                      const percentage = (pointsEarnedInCurrentLevel / totalPointsForCurrentLevelSpan) * 100;
                      progressWidth = `${Math.max(0, Math.min(percentage, 100))}%`;
                    }
                    
                    // This IIFE is for the text part. We need to render the progress bar outside or pass width.
                    // For simplicity, this example will just return the text, and the style block will re-calculate or use these values.
                    // To be cleaner, these calculated values (pointsText, progressWidth) should be derived once.
                    // Let's structure this so we compute them once.
                    return pointsText;
                  })()
                }
                {/* Progress bar styling will now use similarly robust logic or pre-calculated values */}
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{
                      width: (() => {
                        const { level, points, nextLevelPoints: serverNextLevelPoints } = currentUser;
                        const currentLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === level);
                        const pointsAtCurrentLevelStart = currentLevelInfo ? currentLevelInfo.pointsNeeded : 0;

                        let resolvedNextLevelPoints: number;
                        if (typeof serverNextLevelPoints === 'number' && serverNextLevelPoints !== null) {
                            resolvedNextLevelPoints = serverNextLevelPoints;
                        } else {
                            const nextClientThreshold = LEVEL_THRESHOLDS.find(lt => lt.level === level + 1);
                            resolvedNextLevelPoints = nextClientThreshold ? nextClientThreshold.pointsNeeded : Infinity;
                        }

                        const pointsEarnedInCurrentLevel = points - pointsAtCurrentLevelStart;
                        const totalPointsForCurrentLevelSpan = resolvedNextLevelPoints - pointsAtCurrentLevelStart;

                        if (resolvedNextLevelPoints === Infinity || totalPointsForCurrentLevelSpan <= 0) {
                          return '100%';
                        }
                        if (totalPointsForCurrentLevelSpan === 0) {
                            return '0%'; // Avoid division by zero, default to 0%
                        }
                        const percentage = (pointsEarnedInCurrentLevel / totalPointsForCurrentLevelSpan) * 100;
                        return `${Math.max(0, Math.min(percentage, 100))}%`;
                      })()
                    }}
                  ></div>
                </div>
              </div>
              <div className="stat-item">
                <strong>Current Streak:</strong> {currentUser.currentStreak} days 🔥
              </div>
              <div className="stat-item">
                <strong>Workouts Completed:</strong> {currentUser.workoutsCompleted ?? 0}
              </div>
              <div className="stat-item">
                <strong>Meals Tracked:</strong> {currentUser.mealsTracked ?? 0}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero-section">
          <h1 className="page-title">Welcome to FitFlow</h1>
          <p className="hero-subtitle">Your ultimate companion for tracking workouts, nutrition, and weight progress.</p>
          {/* Login and Register buttons removed as per user request */}
        </section>
      )}

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card-icon"><WorkoutIcon /></div>
            <h3>Workout Tracking</h3>
            <p>Log your exercises, sets, and reps. Monitor your strength gains and workout consistency over time.</p>
            <Link to="/workouts" className="btn-primary">Track Workouts</Link>
          </div>

          <div className="feature-card">
            <div className="feature-card-icon"><NutritionIcon /></div>
            <h3>Nutrition Logging</h3>
            <p>Keep a detailed record of your meals and macronutrients. Understand your eating habits and fuel your body right.</p>
            <Link to="/nutrition" className="btn-primary" onClick={(e) => { e.preventDefault(); alert('Nutrition page coming soon!'); }}>Log Nutrition</Link>
          </div>

          <div className="feature-card">
            <div className="feature-card-icon"><WeightIcon /></div>
            <h3>Weight Progress</h3>
            <p>Monitor your weight changes with easy logging and visual charts. Stay focused on your weight goals.</p>
            <Link to="/weight" className="btn-primary" onClick={(e) => { e.preventDefault(); alert('Weight tracking coming soon!'); }}>Track Weight</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;