import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import Dashboard from './pages/Dashboard';
import Forms from './pages/Forms';
import Tables from './pages/Tables';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Documents from './pages/Documents';
import Icons from './pages/Icons';
import Login from './pages/Login';
import OPCUAStatus from './pages/OPCUAStatus';
import './index.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Navbar 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <Sidebar 
            collapsed={sidebarCollapsed}
            darkMode={darkMode}
          />
          
          <main className={`transition-all duration-300 pt-24 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
              <Route path="/maintenance" element={<Forms darkMode={darkMode} />} />
              <Route path="/spare-parts" element={<Tables darkMode={darkMode} />} />
              <Route path="/reports" element={<Documents darkMode={darkMode} />} />
              <Route path="/equipment" element={<Icons darkMode={darkMode} />} />
              <Route path="/tracking" element={<Profile darkMode={darkMode} />} />
              <Route path="/report-workorder-gm" element={<Contact darkMode={darkMode} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;













