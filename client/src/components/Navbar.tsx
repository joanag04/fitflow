import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/FitFlow.png';

const Navbar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

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
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Add or remove no-scroll class to body based on menu state
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMenuOpen]);

  return (
    <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`} ref={navRef}>
      <div className="nav-container">
        <NavLink to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)}>
          <img src={logo} alt="FitFlow Logo" className="logo-image" />
          <span className="logo-text">FitFlow</span>
        </NavLink>

        <button 
          className="menu-button" 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="menu-icon"></span>
        </button>

        <ul className="nav-links">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/workouts" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Workouts
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/nutrition" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Nutrition
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/weight" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Weight
            </NavLink>
          </li>
          {isAuthenticated ? (
            <li>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                  setIsMenuOpen(false);
                }} 
                className="nav-link auth-link logout-button"
              >
                Logout
              </button>
            </li>
          ) : (
            <li>
              <NavLink 
                to="/login" 
                className={({ isActive }) => `nav-link auth-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

