import React, { useState, useEffect, useRef } from 'react';

// OPC UA service - replace mock with real connection
const machineStatusService = {
  getServerInfo: () => ({ url: 'opc.tcp://192.168.1.115:49320' }),
  
  // Connect to OPC UA server and read node values
  async connectAndReadNodes(nodeIds) {
    try {
      const response = await fetch('/api/opcua/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          serverUrl: 'opc.tcp://192.168.1.115:49320',
          nodeIds: nodeIds 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to read OPC UA nodes:', error);
      throw error;
    }
  }
};

function Home({ darkMode }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionError, setConnectionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gridStatus, setGridStatus] = useState({});
  const [realTimeData, setRealTimeData] = useState({});
  const wsRef = useRef(null);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        console.log('Connected to WebSocket server');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received real-time data:', data);
        
        if (data.type !== 'connection') {
          setRealTimeData(prev => ({
            ...prev,
            [`${data.serverId}-${data.nodeId}`]: data
          }));
          
          // Update grid status with real-time data
          updateGridStatusWithRealTimeData(data);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Reconnect after 3 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  // Update grid status with real-time data
  const updateGridStatusWithRealTimeData = (data) => {
    setGridStatus(prev => {
      const updated = { ...prev };
      
      // Map nodeId to machine
      if (data.nodeId === 'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode') {
        if (updated.machine1) {
          updated.machine1 = {
            ...updated.machine1,
            value: data.value,
            online: data.value === true,
            lastUpdate: new Date(data.timestamp || data.dataDateTime),
            error: null
          };
        }
      } else if (data.nodeId === 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode') {
        if (updated.machine2) {
          updated.machine2 = {
            ...updated.machine2,
            value: data.value,
            online: data.value === true,
            lastUpdate: new Date(data.timestamp || data.dataDateTime),
            error: null
          };
        }
      }
      
      return updated;
    });
  };

  // Function to read real OPC UA data
  const readMachineStatus = async () => {
    try {
      setConnectionStatus('connecting');
      setConnectionError(null);
      
      const nodeIds = [
        'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode',
        'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode'
      ];
      
      console.log('Attempting to read nodes:', nodeIds);
      
      const response = await fetch('/api/opcua/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          serverUrl: 'opc.tcp://192.168.1.115:49320',
          nodeIds: nodeIds 
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      const data = result.data;
      console.log('Node data:', data);
      
      const updatedGridStatus = {
        machine1: {
          name: 'BINDER 1',
          online: data[0]?.statusCode === 'Good' && data[0]?.value === true,
          nodeId: nodeIds[0],
          value: data[0]?.value,
          unit: '',
          lastUpdate: new Date(),
          error: data[0]?.statusCode !== 'Good' ? data[0]?.statusCode : null,
          position: { top: '20%', left: '10%', width: '15%', height: '20%' }
        },
        machine2: {
          name: 'BINDER 2', 
          online: data[1]?.statusCode === 'Good' && data[1]?.value === true,
          nodeId: nodeIds[1],
          value: data[1]?.value,
          unit: '',
          lastUpdate: new Date(),
          error: data[1]?.statusCode !== 'Good' ? data[1]?.statusCode : null,
          position: { top: '20%', left: '30%', width: '15%', height: '20%' }
        }
      };

      console.log('Updated grid status:', updatedGridStatus);
      setGridStatus(updatedGridStatus);
      setConnectionStatus('connected');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error reading machine status:', error);
      setConnectionError(error.message);
      setConnectionStatus('error');
      setIsLoading(false);
      
      // Set offline status when connection fails
      const offlineGridStatus = {
        machine1: {
          name: 'BINDER 1',
          online: false,
          nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode',
          value: null,
          unit: '',
          lastUpdate: new Date(),
          error: 'Connection failed',
          position: { top: '20%', left: '10%', width: '15%', height: '20%' }
        },
        machine2: {
          name: 'BINDER 2', 
          online: false,
          nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
          value: null,
          unit: '',
          lastUpdate: new Date(),
          error: 'Connection failed',
          position: { top: '20%', left: '30%', width: '15%', height: '20%' }
        }
      };
      setGridStatus(offlineGridStatus);
    }
  };

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectWebSocket();
    
    // Read initial machine status
    readMachineStatus();
    
    // Set up periodic refresh every 30 seconds (less frequent since we have real-time data)
    const interval = setInterval(readMachineStatus, 30000);
    
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6">
      {/* Connection Status */}
      <div className={`mb-4 p-3 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
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

export default Home;





