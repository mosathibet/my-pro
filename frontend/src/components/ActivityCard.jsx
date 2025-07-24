import React from 'react';
import Card from './Card';

const ActivityCard = ({ 
  title, 
  activities = [], 
  darkMode,
  className = '',
  icon = "📋"
}) => {
  return (
    <Card darkMode={darkMode} className={className}>
      <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className={`w-10 h-10 ${activity.bgColor || 'bg-blue-500'} rounded-full flex items-center justify-center`}>
              <span className="text-white text-sm">{activity.icon}</span>
            </div>
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activity.title}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ActivityCard;