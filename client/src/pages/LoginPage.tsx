import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Assuming you're using React Router
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Handle successful login
      console.log('[LoginPage] Login API successful. Response data:', data);
      if (data.token && data.user) {
        console.log('[LoginPage] New token received from API:', data.token); // ADD THIS
        localStorage.setItem('token', data.token);
        console.log('[LoginPage] Token in localStorage IMMEDIATELY AFTER SETTING:', localStorage.getItem('token')); // ADD THIS
        localStorage.setItem('user', JSON.stringify(data.user));
        // TODO: Update global app state if using Context or Redux
        // User will be redirected to home page
        // Manually trigger a state update for Navbar or rely on its own effect
        // A simple way to help Navbar re-check auth, though its useEffect on location change should also work:
        window.dispatchEvent(new Event('storage')); 
        navigate('/'); // Redirect to home page or dashboard
      } else {
        throw new Error('Login successful, but no token or user data received.');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unknown error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2>Login to FitFlow</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <p className="form-error">{error}</p>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary btn-login" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <p className="toggle-auth-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
