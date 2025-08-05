// Machine configuration with OPC UA Node IDs matching your device config
const MACHINE_CONFIG = {
  binder1: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode',
    name: 'Binder 1',
    position: { top: '15%', left: '5%', width: '25%', height: '50%' },
    unit: 'Bar'
  },
  binder2: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Binder 2',
    position: { top: '10%', left: '32%', width: '18%', height: '45%' },
    unit: '°C'
  },
  cutting: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Cutting',
    position: { top: '12%', left: '52%', width: '22%', height: '40%' },
    unit: '°C'
  },
  spiraloven: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Spiral Oven',
    position: { top: '18%', left: '76%', width: '20%', height: '35%' },
    unit: '°C'
  },
  spiralcooling: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Spiral Cooling',
    position: { top: '48%', left: '76%', width: '20%', height: '35%' },
    unit: '°C'
  }
};

class MachineStatusService {
  constructor() {
    this.baseURL = 'http://localhost:3001'; // ใช้ URL ตรงๆ
    console.log('API Base URL:', this.baseURL); // เราะ่ม log
    this.opcServerUrl = 'opc.tcp://192.168.1.115:49320';
    this.subscribers = new Set();
    this.currentStatus = {};
    this.isPolling = false;
    this.connectionStatus = 'disconnected';
  }

  // Connect to OPC UA server via backend API with retry
  async connectToOPCUA() {
    try {
      console.log('Attempting to connect to OPC UA server...');
      
      const response = await fetch(`${this.baseURL}/api/opcua/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        this.connectionStatus = 'connected';
        console.log('✅ Connected to OPC UA server via backend');
        return { connected: true };
      } else {
        this.connectionStatus = 'error';
        console.error('❌ Connection failed:', result.error);
        
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          this.attemptReconnect();
        }, 5000);
        
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to connect to OPC UA server:', error);
      this.connectionStatus = 'error';
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        this.attemptReconnect();
      }, 5000);
      
      throw error;
    }
  }

  // Attempt to reconnect
  async attemptReconnect() {
    try {
      console.log('🔄 Attempting to reconnect...');
      
      const response = await fetch(`${this.baseURL}/api/opcua/reconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        this.connectionStatus = 'connected';
        console.log('✅ Reconnected successfully');
      } else {
        console.error('❌ Reconnection failed:', result.error);
        // Try again in 10 seconds
        setTimeout(() => {
          this.attemptReconnect();
        }, 10000);
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      // Try again in 10 seconds
      setTimeout(() => {
        this.attemptReconnect();
      }, 10000);
    }
  }

  // Enhanced status reading with health check
  async readAllMachineStatus() {
    try {
      // First check health
      const healthResponse = await fetch(`${this.baseURL}/api/opcua/health`);
      const healthResult = await healthResponse.json();
      
      if (!healthResult.connected) {
        console.log('🔄 Server not connected, attempting reconnect...');
        this.connectionStatus = 'reconnecting';
        this.attemptReconnect();
        return {};
      }
      
      // Get machine status
      const response = await fetch(`${this.baseURL}/api/opcua/machine-status`);
      const result = await response.json();
      
      if (result.success) {
        this.currentStatus = result.data;
        this.connectionStatus = result.connected ? 'connected' : 'disconnected';
        this.notifySubscribers(this.currentStatus);
        return this.currentStatus;
      } else {
        console.error('Failed to get machine status:', result.error);
        this.connectionStatus = 'error';
        return {};
      }
    } catch (error) {
      console.error('Error reading machine status:', error);
      this.connectionStatus = 'error';
      return {};
    }
  }

  // Get connection status from backend
  async getConnectionStatusFromBackend() {
    try {
      const response = await fetch(`${this.baseURL}/api/opcua/status`);
      const result = await response.json();
      
      if (result.success) {
        this.connectionStatus = result.connected ? 'connected' : 'disconnected';
        return result;
      }
    } catch (error) {
      console.error('Error getting connection status:', error);
      this.connectionStatus = 'error';
    }
    return null;
  }

  // Start polling machine statuses
  startPolling(interval = 3000) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollInterval = setInterval(async () => {
      await this.readAllMachineStatus();
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // Subscribe to status updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(status) {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status subscriber:', error);
      }
    });
  }

  // Get current cached status
  getCurrentStatus() {
    return this.currentStatus;
  }

  // Get machine configuration
  getMachineConfig() {
    return MACHINE_CONFIG;
  }

  // Get connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Get server info
  getServerInfo() {
    return {
      url: this.opcServerUrl,
      plantCode: '3301'
    };
  }
}

// Export singleton instance
const machineStatusService = new MachineStatusService();
export default machineStatusService;







