import React from 'react';

const Card = ({ 
  children, 
  darkMode, 
  className = '', 
  padding = 'p-6',
  blur = true,
  shadow = true,
  border = true 
}) => {
  const baseClasses = `rounded-lg transition-all duration-200 ${padding}`;
  
  const backgroundClasses = darkMode 
    ? 'bg-gray-800/90 text-white' 
    : 'bg-white/90 text-gray-900';
    
  const borderClasses = border 
    ? (darkMode ? 'border border-gray-700/50' : 'border border-gray-200/50')
    : '';
    
  const shadowClasses = shadow 
    ? (darkMode ? '' : 'shadow-lg')
    : '';
    
  const blurClasses = blur ? 'backdrop-blur-sm' : '';

  return (
    <div className={`
      ${baseClasses} 
      ${backgroundClasses} 
      ${borderClasses} 
      ${shadowClasses} 
      ${blurClasses} 
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;