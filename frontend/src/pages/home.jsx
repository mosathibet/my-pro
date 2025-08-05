import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
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
    // Trigger re-filtering in RealTimeChart
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

  // Sample data for demonstration
  const statsData = [
    {
      title: 'Emails Sent',
      value: '12,361',
      unit: '',
      status: 'Good',
      icon: '📧',
      timestamp: new Date()
    },
    {
      title: 'Sales Obtained',
      value: '431,225',
      unit: '$',
      status: 'Good',
      icon: '💰',
      timestamp: new Date()
    },
    {
      title: 'New Clients',
      value: '32,441',
      unit: '',
      status: 'Good',
      icon: '👥',
      timestamp: new Date()
    },
    {
      title: 'Traffic Received',
      value: '1,325,134',
      unit: '',
      status: 'Good',
      icon: '📊',
      timestamp: new Date()
    },
    {
      title: 'Emails Sent',
      value: '12,361',
      unit: '',
      status: 'Good',
      icon: '📧',
      timestamp: new Date()
    },
    {
      title: 'Sales Obtained',
      value: '431,225',
      unit: '$',
      status: 'Good',
      icon: '💰',
      timestamp: new Date()
    },
    {
      title: 'New Clients',
      value: '32,441',
      unit: '',
      status: 'Good',
      icon: '👥',
      timestamp: new Date()
    },
    {
      title: 'Traffic Received',
      value: '1,325,134',
      unit: '',
      status: 'Good',
      icon: '📊',
      timestamp: new Date()
    }
  ];

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
          Home
        </h1>
        <div className="w-100">
          <FilterBar {...filterProps} />
        </div>
      </div>
      
      
      <div className="mb-6">
        <img src="/pic/flow-test.png" className="w-full h-auto rounded shadow-md opacity-50" />
      </div>
    </div>
  );
}

export default Dashboard;








