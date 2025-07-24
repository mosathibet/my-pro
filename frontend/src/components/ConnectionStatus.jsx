import React, { useState, useEffect } from 'react';
import opcuaService from '../services/opcuaService';

const ConnectionStatus = ({ darkMode }) => {
  const [connectionLogs, setConnectionLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConnectionLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/opcua/connection-logs');
      const result = await response.json();
      if (result.success) {
        setConnectionLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch connection logs:', error);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/opcua/health-check');
      const result = await response.json();
      console.log('Health check result:', result);
      await fetchConnectionLogs(); // Refresh logs
    } catch (error) {
      console.error('Health check failed:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConnectionLogs();
    const interval = setInterval(fetchConnectionLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Connection Status
        </h3>
        <button
          onClick={handleHealthCheck}
          disabled={loading}
          className={`px-4 py-2 rounded transition-colors duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Checking...' : 'Health Check'}
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {connectionLogs.map((log, index) => (
          <div
            key={index}
            className={`p-2 rounded text-sm ${
              log.type === 'connection'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium">{log.message}</span>
              <span className="text-xs opacity-75">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {log.data && (
              <div className="mt-1 text-xs opacity-75">
                {log.data.url} {log.data.attempt && `(Attempt ${log.data.attempt})`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionStatus;