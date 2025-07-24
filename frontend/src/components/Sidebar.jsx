import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import sidebarConfig from '../data/sidebarConfig.json';

function Sidebar({ collapsed, darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleSubItems = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleNavigation = (path) => {
    if (path === 'logout') {
      // Handle logout logic
      console.log('Logging out...');
      return;
    }
    navigate(`/${path}`);
  };

  const isActive = (path) => {
    return location.pathname === `/${path}` || location.pathname === path;
  };

  return (
    <div className={`fixed left-0 top-16 h-full transition-all duration-300 z-40 ${
      collapsed ? 'w-16' : 'w-64'
    } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
      <div className="p-4">
        <div className="space-y-2">
          {sidebarConfig.mainNavigation.map((item) => (
            <div key={item.id}>
              {/* Main Navigation Item */}
              <div 
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  isActive(item.path) 
                    ? 'bg-blue-600 text-white' 
                    : darkMode 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  if (item.subItems) {
                    toggleSubItems(item.id);
                  } else {
                    handleNavigation(item.path);
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
                {!collapsed && item.subItems && (
                  <span className={`transform transition-transform ${
                    expandedItems[item.id] ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                )}
              </div>

              {/* Sub Items */}
              {!collapsed && item.subItems && expandedItems[item.id] && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.id}
                      className={`p-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center space-x-3 ${
                        isActive(subItem.path)
                          ? 'bg-blue-500 text-white'
                          : darkMode
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleNavigation(subItem.path)}
                    >
                      <span className="text-sm">{subItem.icon}</span>
                      <span className="text-sm">{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;




