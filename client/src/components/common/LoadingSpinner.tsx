import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'var(--primary-color)',
  className = ''
}) => {
  const sizeMap = {
    small: '1rem',
    medium: '2rem',
    large: '3rem'
  };

  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{
        '--spinner-size': sizeMap[size],
        '--spinner-color': color
      } as React.CSSProperties}
      role="status"
      aria-label="Loading..."
    >
      <div className="spinner-border" />
    </div>
  );
};

export default LoadingSpinner;
