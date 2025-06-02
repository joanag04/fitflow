import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-2',
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
      <div 
        className="animate-spin rounded-full border-solid border-current border-r-transparent"
        style={{
          borderColor: color,
          borderRightColor: 'transparent',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
