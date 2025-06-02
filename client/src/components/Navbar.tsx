import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/FitFlow.png';

const Navbar: React.FC = () => {
  console.log('[Navbar] Component rendering/re-rendering.'); // Log 1
  console.log('[Navbar] Initial localStorage token:', localStorage.getItem('token')); // Log 2
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  useEffect(() => {
    console.log('[Navbar] useEffect triggered. Pathname:', location.pathname); // Updated log
    const checkAuthStatus = () => {
      const tokenExists = !!localStorage.getItem('token');
      console.log('[Navbar] checkAuthStatus - tokenExists:', tokenExists); // Log 4
      setIsAuthenticated(tokenExists);
    };

    // Removed window.addEventListener('storage', checkAuthStatus) for now to simplify
    // It can be added back if cross-tab sync is a priority later
    checkAuthStatus(); // Check on mount and on path change

    // return () => {
    //   console.log('[Navbar] useEffect cleanup.'); // Log 5
    //   window.removeEventListener('storage', checkAuthStatus);
    // };
  }, [location.pathname]); // <--- Add location.pathname as a dependency

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login page after logout
  };

  console.log('[Navbar] Current isAuthenticated state:', isAuthenticated); // Log 6
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        <img src={logo} alt="FitFlow Logo" className="logo-image" />
        <span className="logo-text">FitFlow</span>
      </NavLink>
      <ul className="nav-links">
        <li><NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink></li>
        <li><NavLink to="/workouts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Workouts</NavLink></li>
        <li><NavLink to="/nutrition" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Nutrition</NavLink></li>
        <li><NavLink to="/weight" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Weight</NavLink></li>
                {isAuthenticated ? (
          <li><button onClick={handleLogout} className="nav-link auth-link logout-button">Logout</button></li>
        ) : (
          <li><NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link auth-link' : 'nav-link auth-link'}>Login</NavLink></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

