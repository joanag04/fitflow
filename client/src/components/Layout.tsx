import React, { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-layout">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      
      <header className="app-header">
        <Navbar />
      </header>
      
      <main id="main-content" className={`app-main ${className}`}>
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
