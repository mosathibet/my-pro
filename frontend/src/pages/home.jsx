import React, { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import CardValue from '../components/CardValue';
import machineStatusService from '../services/machineStatus';

function Dashboard({ darkMode }) {
  // Local filter states for Dashboard
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [timeRange, setTimeRange] = useState({ startTime: '', endTime: '' });

  // Grid status state - now connected to OPC UA
  const [gridStatus, setGridStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Initialize machine status service
  useEffect(() => {
    let unsubscribe;

    const initializeMachineStatus = async () => {
      try {
        setIsLoading(true);
        setConnectionError(null);
        
        // Try to connect to OPC UA server first
        await machineStatusService.connectToOPCUA();
        setConnectionStatus(machineStatusService.getConnectionStatus());
        
        // Subscribe to status updates
        unsubscribe = machineStatusService.subscribe((status) => {
          setGridStatus(status);
          setConnectionError(null);
        });

        // Initial status read
        const initialStatus = await machineStatusService.readAllMachineStatus();
        setGridStatus(initialStatus);
        
        // Start polling every 5 seconds
        machineStatusService.startPolling(5000);
        
        setIsLoading(false);

      } catch (error) {
        console.error('Failed to initialize machine status:', error);
        setConnectionError(error.message);
        setConnectionStatus('error');
        setIsLoading(false);
        
        // Still try to get cached/offline status
        const offlineStatus = machineStatusService.getCurrentStatus();
        if (Object.keys(offlineStatus).length > 0) {
          setGridStatus(offlineStatus);
        }
      }
    };

    initializeMachineStatus();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      machineStatusService.stopPolling();
    };
  }, []);

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

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      default:
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    }
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
          Home
        </h1>
        <div className="w-100">
          <FilterBar {...filterProps} />
        </div>
      </div>

      {/* Connection Status */}
      <div className={`mb-4 p-3 rounded border ${getConnectionStatusColor()}`}>
        <div className="flex justify-between items-center">
          <span>
            OPC UA Server: {connectionStatus === 'connected' ? '🟢 Connected' : connectionStatus === 'error' ? '🔴 Error' : '🟡 Connecting...'}
          </span>
          <span className="text-sm">
            {machineStatusService.getServerInfo().url}
          </span>
        </div>
        {connectionError && (
          <div className="mt-2 text-sm">
            Error: {connectionError}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Loading machine status...
        </div>
      )}
      
      {/* Image with Custom Positioned Grid Overlays */}
      <div className="mb-6 relative">
        <img 
          src="/pic/picture1.png" 
          className="w-full h-auto rounded shadow-md opacity-50" 
          alt="Factory Layout"
        />
        
        {/* Custom Positioned Grid Overlays */}
        {Object.entries(gridStatus).map(([key, status]) => (
          <div
            key={key}
            className={`
              absolute rounded-lg border-2 transition-all duration-500 cursor-pointer
              ${status.online 
                ? 'bg-green-500/30 border-green-400 hover:bg-green-500/40' 
                : 'bg-red-500/30 border-red-400 hover:bg-red-500/40'
              }
            `}
            style={{
              top: status.position.top,
              left: status.position.left,
              width: status.position.width,
              height: status.position.height
            }}
            onClick={() => console.log(`Clicked ${status.name}`, status)}
            title={`${status.name}\nStatus: ${status.online ? 'Online' : 'Offline'}\nNode ID: ${status.nodeId}\nValue: ${status.value} ${status.unit || ''}\nLast Update: ${status.lastUpdate?.toLocaleTimeString()}`}
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  status.online ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className={`text-sm font-semibold ${
                  status.online ? 'text-green-800' : 'text-red-800'
                }`}>
                  {status.name}
                </span>
                <div className={`text-xs mt-1 ${
                  status.online ? 'text-green-700' : 'text-red-700'
                }`}>
                  {status.online ? 'Online' : 'Offline'}
                </div>
                {status.value !== undefined && status.value !== null && (
                  <div className={`text-xs mt-1 font-mono ${
                    status.online ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {typeof status.value === 'number' ? status.value.toFixed(1) : status.value} {status.unit || ''}
                  </div>
                )}
                {status.error && (
                  <div className="text-xs mt-1 text-red-500">
                    Error
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div className="mb-6 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Online
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Offline
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last update: {Object.values(gridStatus)[0]?.lastUpdate?.toLocaleTimeString() || 'Never'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total machines: {Object.keys(gridStatus).length}
          </span>
        </div>
      </div>

      {/* Machine Status Summary */}
      {Object.keys(gridStatus).length > 0 && (
        <div className={`p-4 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-bold mb-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Machine Status Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(gridStatus).map(([key, status]) => (
              <div key={key} className={`p-3 rounded border-l-4 ${
                status.online 
                  ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className={`font-semibold text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {status.name}
                </div>
                <div className={`text-lg font-bold ${
                  status.online ? 'text-green-600' : 'text-red-600'
                }`}>
                  {status.value !== undefined && status.value !== null 
                    ? `${typeof status.value === 'number' ? status.value.toFixed(1) : status.value} ${status.unit || ''}`
                    : status.online ? 'Online' : 'Offline'
                  }
                </div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {status.lastUpdate?.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;












