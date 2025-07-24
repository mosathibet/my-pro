import React from 'react';
import Card from './Card';

const ChartCard = ({ 
  title, 
  children, 
  darkMode,
  className = '',
  isEmpty = false,
  emptyMessage = "No data available for selected period"
}) => {
  return (
    <Card darkMode={darkMode} className={className}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      {isEmpty ? (
        <div className="flex items-center justify-center h-48">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
};

export default ChartCard;