import React, { useState, useEffect } from 'react';
import opcuaService from '../services/opcuaService';
import RealtimeChart from '../components/RealtimeChart';

function OPCUAStatus({ darkMode }) {
  const [servers, setServers] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [diagnostics, setDiagnostics] = useState({});
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState({});
  const [historicalData, setHistoricalData] = useState({});

  useEffect(() => {
    loadServers();
    loadStatus();
    
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received real-time data:', data);
      
      setRealTimeData(prev => ({
        ...prev,
        [`${data.serverId}-${data.nodeId}`]: data
      }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Refresh status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    
    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const loadServers = async () => {
    try {
      const serverList = await opcuaService.getServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const statusData = await opcuaService.getStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleConnect = async (serverId) => {
    setLoading(true);
    try {
      const result = await opcuaService.connectServer(serverId);
      console.log(`Connection result for ${serverId}:`, result);
      await loadStatus(); // Refresh status
    } catch (error) {
      console.error(`Failed to connect to ${serverId}:`, error);
    }
    setLoading(false);
  };

  const handleConnectAll = async () => {
    setLoading(true);
    try {
      const result = await opcuaService.connectAllServers();
      console.log('Connect all result:', result);
      await loadStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to connect to all servers:', error);
    }
    setLoading(false);
  };

  const handleReadNode = async (serverId, nodeId) => {
    try {
      const result = await opcuaService.readNode(serverId, nodeId);
      console.log('Read result:', result);
      alert(`Value: ${result.value}\nStatus: ${result.statusCode}\nTimestamp: ${result.timestamp}`);
    } catch (error) {
      console.error('Failed to read node:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleTestConnection = async (serverId) => {
    setLoading(true);
    try {
      const result = await opcuaService.testConnection(serverId);
      console.log(`Test connection result for ${serverId}:`, result);
      alert(`Test Result: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.message}`);
    } catch (error) {
      console.error(`Test connection failed for ${serverId}:`, error);
      alert(`Test Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleDiscoverEndpoints = async (server) => {
    setLoading(true);
    try {
      console.log(`🔍 Discovering endpoints for ${server.url}...`);
      const result = await opcuaService.discoverEndpoints(server.url);
      
      if (result.success) {
        setDiscoveredEndpoints(prev => ({
          ...prev,
          [server.id]: result.endpoints
        }));
        console.log(`✅ Discovered ${result.endpoints.length} endpoints:`, result.endpoints);
      }
    } catch (error) {
      console.error(`Failed to discover endpoints:`, error);
      alert(`Discovery Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handlePortScan = async (server) => {
    setLoading(true);
    try {
      const url = new URL(server.url);
      const host = url.hostname;
      const port = parseInt(url.port) || 4840;
      
      console.log(`🔍 Scanning port ${host}:${port}...`);
      
      const response = await fetch('http://localhost:5000/api/opcua/scan-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port })
      });
      
      const result = await response.json();
      console.log(`📊 Port scan result:`, result);
      
      setDiagnostics(prev => ({
        ...prev,
        [server.id]: { ...prev[server.id], portScan: result }
      }));
      
      alert(`Port Scan Result:\n${result.message}`);
    } catch (error) {
      console.error(`Port scan failed:`, error);
      alert(`Port Scan Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const loadHistoricalData = async () => {
    try {
      const result = await opcuaService.getLatestReadings('server_192_168_1_115', 100);
      if (result.success) {
        setHistoricalData(result.data);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          OPC UA Servers Status
        </h1>
        
        <button
          onClick={handleConnectAll}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Connecting...' : 'Connect All Servers'}
        </button>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server) => {
          const serverStatus = status[server.id];
          const isConnected = serverStatus?.connected || false;
          
          return (
            <div key={server.id} className={`p-6 rounded-lg shadow-lg transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50'
            }`}>
              {/* Server Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {server.name}
                  </h3>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {server.id}
                  </p>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
              </div>

              {/* Server URL */}
              <div className="mb-4">
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  URL: <span className="font-mono">{server.url}</span>
                </p>
              </div>

              {/* Connection Button */}
              <button
                onClick={() => handleConnect(server.id)}
                disabled={loading || isConnected}
                className={`w-full mb-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isConnected
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                    : loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : darkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isConnected ? 'Connected' : loading ? 'Connecting...' : 'Connect'}
              </button>

              {/* Monitored Nodes */}
              {isConnected && serverStatus?.monitoredNodes && (
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Monitored Nodes ({serverStatus.monitoredNodes.length}):
                  </h4>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {serverStatus.monitoredNodes.map((nodeId) => {
                      const nodeData = realTimeData[`${server.id}-${nodeId}`];
                      
                      return (
                        <div key={nodeId} className={`p-2 rounded border-l-4 transition-all duration-200 ${
                          nodeData?.statusCode === 'Good'
                            ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-l-gray-400 bg-gray-50 dark:bg-gray-800/50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-mono ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {nodeId}
                            </span>
                            
                            <button
                              onClick={() => handleReadNode(server.id, nodeId)}
                              className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${
                                darkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              Read
                            </button>
                          </div>
                          
                          {nodeData && (
                            <div className={`mt-1 text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div>Value: <span className="font-semibold">{nodeData.value}</span></div>
                              <div>Status: <span className="font-semibold">{nodeData.statusCode}</span></div>
                              <div>Updated: {new Date(nodeData.timestamp).toLocaleTimeString()}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Diagnostic Tools */}
              <div className="mt-4 space-y-2">
                <h5 className={`text-sm font-semibold ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Diagnostic Tools:
                </h5>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePortScan(server)}
                    disabled={loading}
                    className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    Port Scan
                  </button>
                  
                  <button
                    onClick={() => handleDiscoverEndpoints(server)}
                    disabled={loading}
                    className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    Discover
                  </button>
                  
                  <button
                    onClick={() => handleTestConnection(server.id)}
                    disabled={loading}
                    className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    Test
                  </button>
                </div>
                
                {/* Diagnostic Results */}
                {diagnostics[server.id]?.portScan && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    diagnostics[server.id].portScan.open
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    Port: {diagnostics[server.id].portScan.message}
                  </div>
                )}
                
                {/* Discovered Endpoints */}
                {discoveredEndpoints[server.id] && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="font-semibold mb-1">
                      Found {discoveredEndpoints[server.id].length} endpoints:
                    </div>
                    {discoveredEndpoints[server.id].slice(0, 3).map((endpoint, idx) => (
                      <div key={idx} className="font-mono text-xs">
                        • {endpoint.securityMode} - {endpoint.endpointUrl}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Data Summary */}
      {Object.keys(realTimeData).length > 0 && (
        <div className={`mt-8 p-6 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Real-time Data Stream
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(realTimeData).slice(-6).map(([key, data]) => (
              <div key={key} className={`p-3 rounded border-l-4 border-l-blue-500 ${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className={`text-sm font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.serverName}
                </div>
                <div className={`text-xs font-mono ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {data.nodeId}
                </div>
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {data.value}
                </div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(data.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeChart 
          serverId="server_192_168_1_115" 
          nodeId="ns=2;s=Temperature" 
          darkMode={darkMode} 
        />
        <RealtimeChart 
          serverId="server_192_168_1_115" 
          nodeId="ns=2;s=Pressure" 
          darkMode={darkMode} 
        />
        <RealtimeChart 
          serverId="server_192_168_1_115" 
          nodeId="ns=2;s=FlowRate" 
          darkMode={darkMode} 
        />
        <RealtimeChart 
          serverId="server_192_168_1_115" 
          nodeId="ns=2;s=Status" 
          darkMode={darkMode} 
        />
      </div>
    </div>
  );
}

export default OPCUAStatus;




