import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>FitFlow</h3>
          <p>Your personal fitness companion for tracking workouts, nutrition, and progress.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/workouts" className="footer-link">Workouts</Link></li>
            <li><Link to="/nutrition" className="footer-link">Nutrition</Link></li>
            <li><Link to="/weight" className="footer-link">Weight Tracker</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
            <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
            <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="https://facebook.com" aria-label="Facebook" className="social-link">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://twitter.com" aria-label="Twitter" className="social-link">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="social-link">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} FitFlow. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
