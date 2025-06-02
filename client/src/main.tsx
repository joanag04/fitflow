import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter, useNavigate } from 'react-router-dom';

// Create a wrapper component to handle initial auth check
const AppWrapper = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // If no token and not on login/signup page, redirect to login
    const token = localStorage.getItem('token');
    const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);
    
    if (!token && !isAuthPage) {
      navigate('/login');
    }
  }, [navigate]);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>,
);
