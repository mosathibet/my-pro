import React from 'react';

function Navbar({ sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 h-16 flex items-center px-4 z-50 transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800 text-white border-b border-gray-700' 
        : 'bg-white text-gray-900 border-b border-gray-200 shadow-sm'
    }`}>
      <button 
        onClick={toggleSidebar} 
        className={`mr-4 p-2 rounded-lg transition-colors duration-200 ${
          darkMode 
            ? 'hover:bg-gray-700 text-white' 
            : 'hover:bg-gray-100 text-gray-900'
        }`}
      >
        ☰
      </button>
      
      <h1 className={`text-xl font-bold ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Dashboard
      </h1>
      
      <button 
        onClick={toggleDarkMode} 
        className={`ml-auto p-2 rounded-lg transition-colors duration-200 ${
          darkMode 
            ? 'hover:bg-gray-700 text-white' 
            : 'hover:bg-gray-100 text-gray-900'
        }`}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </nav>
  );
}

export default Navbar;



