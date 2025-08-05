const express = require('express');
const { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem, TimestampsToReturn } = require("node-opcua");
const router = express.Router();

// Disable certificate validation
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// OPC UA Client instance
let opcClient = null;
let opcSession = null;
let subscription = null;
let isConnected = false;

// Machine configuration matching frontend
const MACHINE_CONFIG = {
  binder1: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode',
    name: 'Binder 1',
    unit: 'Bar'
  },
  binder2: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Binder 2',
    unit: '°C'
  },
  cutting: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Cutting',
    unit: '°C'
  },
  spiraloven: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Spiral Oven',
    unit: '°C'
  },
  spiralcooling: {
    nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_2.LINE2.Automatic_Mode',
    name: 'Spiral Cooling',
    unit: '°C'
  }
};

// Current machine status
let currentMachineStatus = {};

// Connect to OPC UA Server with better error handling
async function connectToOPCUA() {
  try {
    if (isConnected) return true;

    console.log('Connecting to OPC UA server: opc.tcp://192.168.1.115:49320');
    
    opcClient = OPCUAClient.create({
      applicationName: "MachineStatusClient",
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3,
        maxDelay: 10000
      },
      securityMode: "None",
      securityPolicy: "None",
      endpointMustExist: false,
      keepSessionAlive: true,
      requestedSessionTimeout: 60000,
      clientCertificateManager: null //  certificate manager
    });

    // Add connection event handlers
    opcClient.on("connection_reestablished", () => {
      console.log("OPC UA connection reestablished");
      isConnected = true;
    });

    opcClient.on("connection_lost", () => {
      console.log("OPC UA connection lost");
      isConnected = false;
    });

    opcClient.on("backoff", (retry, delay) => {
      console.log(`OPC UA connection attempt ${retry}, waiting ${delay}ms`);
    });

    await opcClient.connect('opc.tcp://192.168.1.115:49320');
    console.log("Connected to OPC UA server successfully");
    
    opcSession = await opcClient.createSession();
    console.log("OPC UA session created successfully");
    
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Failed to connect to OPC UA server:', error.message);
    isConnected = false;
    
    // Clean up on error
    if (opcClient) {
      try {
        await opcClient.disconnect();
      } catch (e) {
        console.error('Error during cleanup:', e.message);
      }
      opcClient = null;
    }
    
    throw error;
  }
}

// Create subscription for machine status monitoring
async function createMachineStatusSubscription() {
  try {
    if (!opcSession) {
      throw new Error('OPC UA session not available');
    }

    subscription = ClientSubscription.create(opcSession, {
      requestedPublishingInterval: 1000,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10
    });

    subscription.on("started", () => {
      console.log("Machine status subscription started");
    });

    subscription.on("keepalive", () => {
      console.log("Machine status subscription keepalive");
    });

    subscription.on("terminated", () => {
      console.log("Machine status subscription terminated");
    });

    // Monitor each machine
    for (const [machineKey, config] of Object.entries(MACHINE_CONFIG)) {
      const monitoredItem = ClientMonitoredItem.create(
        subscription,
        {
          nodeId: config.nodeId,
          attributeId: AttributeIds.Value
        },
        {
          samplingInterval: 1000,
          discardOldest: true,
          queueSize: 10
        },
        TimestampsToReturn.Both
      );

      monitoredItem.on("changed", (dataValue) => {
        const isOnline = parseStatusValue(dataValue.value.value);
        
        currentMachineStatus[machineKey] = {
          online: isOnline,
          name: config.name,
          nodeId: config.nodeId,
          unit: config.unit,
          value: dataValue.value.value,
          lastUpdate: new Date(),
          rawValue: dataValue.value.value,
          quality: dataValue.statusCode.name
        };

        console.log(`${config.name}: ${isOnline ? 'Online' : 'Offline'} (${dataValue.value.value})`);
      });

      console.log(`Monitoring ${config.name} - ${config.nodeId}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to create machine status subscription:', error);
    throw error;
  }
}

// Parse status value to boolean
function parseStatusValue(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1';
  }
  return false;
}

// Disconnect from OPC UA
async function disconnectFromOPCUA() {
  try {
    if (subscription) {
      await subscription.terminate();
      subscription = null;
    }
    
    if (opcSession) {
      await opcSession.close();
      opcSession = null;
    }
    
    if (opcClient) {
      await opcClient.disconnect();
      opcClient = null;
    }
    
    isConnected = false;
    console.log('Disconnected from OPC UA server');
  } catch (error) {
    console.error('Error disconnecting from OPC UA:', error);
  }
}

// API Routes

// Connect to OPC UA server
router.post('/connect', async (req, res) => {
  try {
    await connectToOPCUA();
    await createMachineStatusSubscription();
    
    res.json({
      success: true,
      message: 'Connected to OPC UA server successfully',
      serverUrl: 'opc.tcp://192.168.1.115:49320'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current machine status
router.get('/machine-status', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Not connected to OPC UA server',
        data: {}
      });
    }

    res.json({
      success: true,
      data: currentMachineStatus,
      connected: isConnected,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    connected: isConnected,
    serverUrl: 'opc.tcp://192.168.1.115:49320',
    machineCount: Object.keys(currentMachineStatus).length,
    lastUpdate: Object.values(currentMachineStatus)[0]?.lastUpdate || null
  });
});

// Disconnect from OPC UA server
router.post('/disconnect', async (req, res) => {
  try {
    await disconnectFromOPCUA();
    currentMachineStatus = {};
    
    res.json({
      success: true,
      message: 'Disconnected from OPC UA server'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add health check endpoint
router.get('/health', async (req, res) => {
  try {
    let serverReachable = false;
    let nodeReadable = false;
    
    if (isConnected && opcSession) {
      try {
        // Try to read a simple node to test connection
        const result = await opcSession.read({
          nodeId: 'ns=2;s=PLC_SIEMENS.BINDER_1.LINE1.Automatic_Mode',
          attributeId: AttributeIds.Value
        });
        
        nodeReadable = result.statusCode.name === 'Good';
        serverReachable = true;
      } catch (error) {
        console.error('Health check read failed:', error.message);
        serverReachable = false;
      }
    }
    
    res.json({
      success: true,
      connected: isConnected,
      serverReachable,
      nodeReadable,
      serverUrl: 'opc.tcp://192.168.1.115:49320',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add manual reconnect endpoint
router.post('/reconnect', async (req, res) => {
  try {
    console.log('Manual reconnection requested...');
    
    // Disconnect first
    await disconnectFromOPCUA();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reconnect
    await connectToOPCUA();
    await createMachineStatusSubscription();
    
    res.json({
      success: true,
      message: 'Reconnected to OPC UA server successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;




