import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import RealTimeChart from '../components/RealTimeChart';
import RealTimeDataDisplay from '../components/RealTimeDataDisplay';
import CardValue from '../components/CardValue';

function Dashboard({ darkMode }) {
  // Local filter states for Dashboard
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [timeRange, setTimeRange] = useState({ startTime: '', endTime: '' });

  const handleSearch = () => {
    console.log('Dashboard search with filters:', {
      selectedYear,
      selectedMonth,
      dateRange,
      timeRange
    });
  };

  const handleClear = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth('all');
    setDateRange({ startDate: '', endDate: '' });
    setTimeRange({ startTime: '', endTime: '' });
    console.log('Dashboard filters cleared');
  };

  const filterProps = {
    darkMode,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    dateRange,
    setDateRange,
    timeRange,
    setTimeRange,
    onSearch: handleSearch,
    onClear: handleClear,
    compact: false
  };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Header with FilterBar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-3xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          HOME
        </h1>
        <div className="w-100">
          <FilterBar {...filterProps} />
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="mb-8">
        <div className={`relative rounded-lg overflow-hidden shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <img 
            src="/pic/bdgvd_page-0001.jpg" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/1200x300/4F46E5/FFFFFF?text=Factory+Overview";
            }}
          />
          <div className="justify-center">
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
