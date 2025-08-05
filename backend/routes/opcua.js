const express = require('express');
const { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem, TimestampsToReturn } = require("node-opcua");
const router = express.Router();

// POST /api/opcua/read - Read OPC UA nodes
router.post('/read', async (req, res) => {
  const { serverUrl, nodeIds } = req.body;
  
  if (!serverUrl || !nodeIds || !Array.isArray(nodeIds)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing serverUrl or nodeIds' 
    });
  }

  const client = OPCUAClient.create({
    applicationName: "MyClient",
    connectionStrategy: {
      initialDelay: 1000,
      maxRetry: 1
    },
    securityMode: "None",
    securityPolicy: "None",
    endpointMustExist: false
  });

  try {
    await client.connect(serverUrl);
    const session = await client.createSession();
    
    const nodesToRead = nodeIds.map(nodeId => ({
      nodeId: nodeId,
      attributeId: AttributeIds.Value
    }));
    
    const dataValues = await session.read(nodesToRead);
    
    const results = dataValues.map((dataValue, index) => ({
      nodeId: nodeIds[index],
      value: dataValue.value ? dataValue.value.value : null,
      statusCode: dataValue.statusCode ? dataValue.statusCode.name : 'Bad',
      timestamp: new Date().toISOString()
    }));
    
    await session.close();
    await client.disconnect();
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('OPC UA Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

module.exports = router;

