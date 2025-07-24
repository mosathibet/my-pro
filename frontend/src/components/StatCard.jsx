import React from 'react';
import Card from './Card';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor = 'bg-blue-500',
  darkMode,
  className = ''
}) => {
  return (
    <Card darkMode={darkMode} className={className}>
      <div className="flex items-center">
        <div className={`p-2 ${iconColor} rounded-lg`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;