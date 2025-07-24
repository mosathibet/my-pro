import React, { useState, useEffect } from 'react';

const DebugPanel = ({ darkMode }) => {
  const [monitoringStatus, setMonitoringStatus] = useState([]);
  const [mongoStats, setMongoStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/opcua/monitoring-status');
      const result = await response.json();
      if (result.success) {
        setMonitoringStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring status:', error);
    }
  };

  const fetchMongoStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/data/stats');
      const result = await response.json();
      if (result.success) {
        setMongoStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch MongoDB stats:', error);
    }
  };

  const handleFlushBatch = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/opcua/flush-batch', {
        method: 'POST'
      });
      const result = await response.json();
      console.log('Flush result:', result);
      await fetchMongoStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to flush batch:', error);
    }
    setLoading(false);
  };

  const handleManualRead = async (serverId, nodeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/opcua/manual-read/${serverId}/${encodeURIComponent(nodeId)}`);
      const result = await response.json();
      console.log('Manual read result:', result);
      alert(`Manual Read Result:\nValue: ${result.data?.value}\nStatus: ${result.data?.statusCode}`);
    } catch (error) {
      console.error('Manual read failed:', error);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchMonitoringStatus();
    fetchMongoStats();
    
    const interval = setInterval(() => {
      fetchMonitoringStatus();
      fetchMongoStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Debug Panel
        </h3>
        <button
          onClick={handleFlushBatch}
          disabled={loading}
          className={`px-4 py-2 rounded transition-colors duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : darkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {loading ? 'Flushing...' : 'Flush MongoDB Batch'}
        </button>
      </div>

      {/* MongoDB Stats */}
      {mongoStats && (
        <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            MongoDB Status
          </h4>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>Connected: {mongoStats.isConnected ? '✅' : '❌'}</p>
            <p>Readings: {mongoStats.collections?.readings || 0}</p>
            <p>Events: {mongoStats.collections?.events || 0}</p>
            <p>Batch Buffer: {mongoStats.batchBuffer || 0}</p>
          </div>
        </div>
      )}

      {/* Monitoring Status */}
      <div className="space-y-3">
        {monitoringStatus.map((server) => (
          <div
            key={server.id}
            className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {server.name}
              </h4>
              <span className={`text-sm px-2 py-1 rounded ${
                server.isConnected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {server.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>Subscription: {server.hasSubscription ? '✅' : '❌'}</p>
              <p>Monitored Nodes: {server.monitoredItemsCount}</p>
              <p>Connection Attempts: {server.connectionAttempts}</p>
            </div>

            {/* Manual Read Buttons */}
            {server.monitoredNodes.length > 0 && (
              <div className="mt-2 space-x-2">
                {server.monitoredNodes.slice(0, 2).map((nodeId) => (
                  <button
                    key={nodeId}
                    onClick={() => handleManualRead(server.id, nodeId)}
                    className={`text-xs px-2 py-1 rounded ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Read {nodeId.split('.').pop()}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;