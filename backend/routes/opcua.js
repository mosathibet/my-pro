const express = require('express');
const { OPCUAClient, AttributeIds } = require('node-opcua');
const router = express.Router();

// Store multiple client connections
const opcuaClients = new Map();
const sessions = new Map();

// Read endpoint with multiple server support
router.post('/read', async (req, res) => {
  try {
    const { serverUrl, nodeIds } = req.body;
    console.log(`📡 Reading from: ${serverUrl}`);
    console.log(`🔍 NodeIDs: ${JSON.stringify(nodeIds)}`);
    
    // Get or create client for this server
    let opcuaClient = opcuaClients.get(serverUrl);
    let session = sessions.get(serverUrl);
    
    if (!opcuaClient) {
      console.log(`🔌 Creating new OPC UA client for ${serverUrl}...`);
      opcuaClient = OPCUAClient.create({
        applicationName: "WebApp Client",
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 3
        },
        requestedSessionTimeout: 60000
      });
      
      try {
        console.log(`🔗 Connecting to ${serverUrl}...`);
        await opcuaClient.connect(serverUrl);
        console.log(`✅ Connected to ${serverUrl}`);
        
        session = await opcuaClient.createSession();
        console.log(`✅ Session created for ${serverUrl}`);
        
        // Store client and session
        opcuaClients.set(serverUrl, opcuaClient);
        sessions.set(serverUrl, session);
      } catch (connectError) {
        console.error(`❌ Failed to connect to ${serverUrl}:`, connectError.message);
        throw new Error(`Cannot connect to ${serverUrl}: ${connectError.message}`);
      }
    }

    const nodesToRead = nodeIds.map(nodeId => ({
      nodeId: nodeId,
      attributeId: AttributeIds.Value
    }));

    console.log(`📖 Reading ${nodeIds.length} nodes from ${serverUrl}...`);
    const dataValues = await session.read(nodesToRead);
    
    const results = dataValues.map((dataValue, index) => {
      const result = {
        nodeId: nodeIds[index],
        value: dataValue.value?.value,
        statusCode: dataValue.statusCode.name,
        timestamp: dataValue.serverTimestamp
      };
      console.log(`📊 ${nodeIds[index]}: ${result.value} (${result.statusCode})`);
      return result;
    });

    res.json({ 
      success: true, 
      data: results,
      connected: true,
      serverUrl: serverUrl
    });

  } catch (error) {
    console.error(`❌ OPC UA read error for ${req.body.serverUrl}:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      connected: false,
      serverUrl: req.body.serverUrl
    });
  }
});

// Health check for specific server
router.post('/health', async (req, res) => {
  const { serverUrl } = req.body;
  const client = opcuaClients.get(serverUrl);
  
  res.json({ 
    success: true, 
    connected: client ? true : false,
    serverUrl: serverUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;




