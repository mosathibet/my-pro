import React from 'react';
import Card from './Card';

const CardValue = ({ 
  title, 
  value, 
  unit = '', 
  status = 'Good', 
  timestamp, 
  darkMode,
  icon = '',
  className = '',
  onClick = null
}) => {
  const isGoodStatus = status === 'Good';
  
  const cardClassName = `border-l-4 transition-all duration-300 cursor-pointer hover:scale-105 ${
    isGoodStatus
      ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
  } ${className}`;
  
  return (
    <Card 
      darkMode={darkMode} 
      className={cardClassName}
      padding="p-4"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </div>
        {status && (
          <div className={`w-3 h-3 rounded-full ${
            isGoodStatus ? 'bg-green-500' : 'bg-red-500'
          }`} />
        )}
      </div>
      
      <div className={`text-2xl font-bold mb-2 ${
        darkMode ? 'text-blue-400' : 'text-blue-600'
      }`}>
        {value} {unit && <span className="text-lg text-gray-500">{unit}</span>}
      </div>
      
      {timestamp && (
        <div className={`text-xs ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
      
      {status && (
        <div className={`text-xs font-mono mt-1 ${
          isGoodStatus 
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {status}
        </div>
      )}
    </Card>
  );
};

export default CardValue;