import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreateWorkoutPage from './pages/CreateWorkoutPage';
import WorkoutsPage from './pages/WorkoutsPage';
import NutritionPage from './pages/NutritionPage';
import WeightPage from './pages/WeightPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import MealDetailPage from './pages/MealDetailPage';
import NutritionLogDetailPage from './pages/NutritionLogDetailPage';
import ChatWidget from './components/ChatWidget';
import './App.css';

// A wrapper for protected routes
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/workouts/create" element={<CreateWorkoutPage />} />
            <Route path="/workouts/edit/:workoutId" element={<CreateWorkoutPage />} /> {/* Reusing CreateWorkoutPage for editing */}
            <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/nutrition/logs/:logId" element={<NutritionLogDetailPage />} />
            <Route path="/nutrition/meals/:mealId/edit" element={<MealDetailPage editMode={true} />} />
            <Route path="/nutrition/meals/:mealId" element={<MealDetailPage editMode={false} />} />
            <Route path="/weight" element={<WeightPage />} />
          </Route>
          
          {/* Redirect any unknown paths to home or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ChatWidget />
    </>
  );
};

export default App;
