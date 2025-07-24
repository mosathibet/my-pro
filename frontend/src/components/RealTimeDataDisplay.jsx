import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';

const RealTimeDataDisplay = ({ darkMode }) => {
  const [realTimeData, setRealTimeData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        console.log('Connected to WebSocket server');
        setConnectionStatus('Connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received real-time data:', data);
          
          if (data.type !== 'connection') {
            setRealTimeData(prev => ({
              ...prev,
              [data.nodeId]: {
                ...data,
                receivedAt: new Date()
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('Disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          setConnectionStatus('Reconnecting...');
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Connecting...':
      case 'Reconnecting...':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'Connected':
        return '🟢';
      case 'Connecting...':
      case 'Reconnecting...':
        return '🟡';
      default:
        return '🔴';
    }
  };

  return (
    <Card darkMode={darkMode} className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Real-time Data Stream
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()} {connectionStatus}
        </div>
      </div>
      
      {Object.keys(realTimeData).length === 0 ? (
        <div className={`text-center py-8 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {connectionStatus === 'Connected' 
            ? 'Waiting for data...' 
            : 'No real-time data available'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {Object.entries(realTimeData).map(([nodeId, data]) => (
            <CardValue
              key={nodeId}
              title={data.tagDataName || nodeId}
              value={typeof data.value === 'number' ? data.value.toFixed(2) : data.value}
              unit={data.unit || ''}
              status={data.statusCode}
              timestamp={data.timestamp}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

const CardValue = ({ title, value, unit, status, timestamp, darkMode }) => {
  const isGoodStatus = status === 'Good';
  
  return (
    <Card 
      darkMode={darkMode} 
      className={`border-l-4 transition-all duration-300 ${
        isGoodStatus
          ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      }`}
      padding="p-4"
    >
      <div className={`text-sm font-semibold mb-1 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </div>
      <div className={`text-2xl font-bold mb-1 ${
        darkMode ? 'text-blue-400' : 'text-blue-600'
      }`}>
        {value} {unit}
      </div>
      <div className={`text-xs ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {new Date(timestamp).toLocaleTimeString()}
      </div>
      <div className={`text-xs font-mono ${
        isGoodStatus 
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}>
        Status: {status}
      </div>
    </Card>
  );
};

export { CardValue };
export default RealTimeDataDisplay;

