const { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem, TimestampsToReturn } = require("node-opcua");
const { MongoClient } = require('mongodb');
const WebSocketServer = require('./websocket-server');

class KepwareToMongoDB {
    constructor(opcServerUrl, mongoUrl, deviceConfig) {
        this.opcServerUrl = opcServerUrl;
        this.mongoUrl = mongoUrl;
        this.deviceConfig = deviceConfig;
        this.client = null;
        this.session = null;
        this.mongoClient = null;
        this.db = null;
        this.collection = null;
        this.subscription = null;
        this.lastStoredValue = new Map();
        this.pendingData = new Map(); // เก็บข้อมูล รอการ
        this.saveTimers = new Map(); // เก็บ timer แต่ละ deviceId
        this.wsServer = new WebSocketServer(8080);
    }

    async connect() {
        try {
            console.log('Connecting to OPC UA server:', this.opcServerUrl);
            this.client = OPCUAClient.create({
                applicationName: "KepwareToMongoDB",
                connectionStrategy: {
                    initialDelay: 1000,
                    maxRetry: 1
                }
            });

            await this.client.connect(this.opcServerUrl);
            console.log("Connected to OPC UA server successfully");
            
            this.session = await this.client.createSession();
            console.log("OPC UA session created successfully");
            
            // Connect to MongoDB
            this.mongoClient = new MongoClient(this.mongoUrl);
            await this.mongoClient.connect();
            console.log("Connected to MongoDB successfully");

            this.db = this.mongoClient.db('kepware_data');
            this.collection = this.db.collection('pressure_data');
            console.log("MongoDB database and collection initnodeialized");

            // Test MongoDB connection with write operation
            try {
                const testDocument = {
                    test: true,
                    message: "Test document",
                    timestamp: new Date()
                };
                const insertResult = await this.collection.insertOne(testDocument);
                console.log("MongoDB test write successful:", insertResult.insertedId);
                
                // Verify we can read it back
                const findResult = await this.collection.findOne({ _id: insertResult.insertedId });
                console.log("MongoDB test read successful:", findResult);
            } catch (testError) {
                console.error("MongoDB test failed:", testError);
            }
        } catch (error) {
            console.error("Failed to connect:", error.message);
            throw error;
        }
    }

    async createSubscriptions() {
        try {
            console.log("Creating subscription for devices:", this.deviceConfig.length);
            
            // สร้าง subscription  session
            const subscription = ClientSubscription.create(this.session, {
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 100,
                requestedMaxKeepAliveCount: 10,
                maxNotificationsPerPublish: 100,
                publishingEnabled: true,
                priority: 10
            });
            
            subscription.on("started", () => {
                console.log("Subscription started, id:", subscription.subscriptionId);
            });
            
            // Subscribe to all tags from all devices
            for (const device of this.deviceConfig) {
                console.log(`Creating monitors for device ${device.deviceId} with ${device.tags.length} tags`);
                
                for (const tag of device.tags) {
                    console.log(`Monitoring tag: ${tag.tagDataName}, nodeId: ${tag.nodeId}`);
                    
                    const monitoredItem = ClientMonitoredItem.create(
                        subscription,
                        { nodeId: tag.nodeId, attributeId: AttributeIds.Value },
                        { samplingInterval: 1000, discardOldest: true, queueSize: 10 },
                        TimestampsToReturn.Both
                    );
                    
                    monitoredItem.on("changed", (dataValue) => {
                        this.handleDataChange(device, tag, dataValue);
                    });
                }
            }
            
            this.subscription = subscription;
            console.log("Subscriptions created successfully");
            
        } catch (error) {
            console.error("Subscription error:", error);
            throw error;
        }
    }

    handleDataChange(device, tag, dataValue) {
        const value = dataValue.value.value;
        const statusCode = dataValue.statusCode.name;
        const timestamp = new Date();
        
        console.log(`📊 Data received - Device: ${device.deviceId}, Tag: ${tag.tagDataName}, Value: ${value}`);
        
        // Broadcast ข้อมูล  WebSocket clients
        const realtimeData = {
            deviceId: device.deviceId,
            nodeId: tag.nodeId,
            tagDataName: tag.tagDataName,
            value: value,
            unit: tag.unit,
            statusCode: statusCode,
            timestamp: timestamp.toISOString(),
            dataDateTime: timestamp
        };
        
        console.log('🚀 Broadcasting real-time data:', realtimeData);
        this.wsServer.broadcast(realtimeData);
        
        // Group data by deviceId (same logic as before)
        if (!this.pendingData.has(device.deviceId)) {
            this.pendingData.set(device.deviceId, {
                deviceId: device.deviceId,
                plantCode: device.plantCode,
                deviceType: device.deviceType,
                timestamp: timestamp,
                tagDataItems: []
            });
        }
        
        // Add tag data
        const deviceData = this.pendingData.get(device.deviceId);
        deviceData.tagDataItems.push({
            tagDataName: tag.tagDataName,
            value: value,
            unit: tag.unit || "",
            nodeId: tag.nodeId,
            statusCode: statusCode,
            dataDateTime: timestamp.getTime()
        });
        
        // Update timestamp and reset timer
        deviceData.timestamp = timestamp;
        
        if (this.saveTimers.has(device.deviceId)) {
            clearTimeout(this.saveTimers.get(device.deviceId));
        }
        
        const timer = setTimeout(async () => {
            if (this.pendingData.has(device.deviceId)) {
                const dataToStore = this.pendingData.get(device.deviceId);
                
                try {
                    console.log(`Attempting to store data for device ${device.deviceId}:`, JSON.stringify(dataToStore, null, 2));
                    const result = await this.collection.insertOne(dataToStore);
                    console.log(`Successfully stored data to MongoDB for device ${device.deviceId}:`, result.insertedId);
                    console.log(`Data contains ${dataToStore.tagDataItems.length} tags`);
                } catch (mongoError) {
                    console.error(`MongoDB insert error for device ${device.deviceId}:`, mongoError);
                }
                
                this.pendingData.delete(device.deviceId);
                this.saveTimers.delete(device.deviceId);
            }
        }, 5000);
        
        this.saveTimers.set(device.deviceId, timer);
    }

    async storeChangedValue(device, tag, dataValue) {
        try {
            const value = dataValue.value.value;
            const timestamp = dataValue.sourceTimestamp || new Date();
            const lastValue = this.lastStoredValue.get(tag.nodeId);
            
            console.log(`Value check: ${tag.nodeId} = ${value}, lastValue = ${lastValue}`);
            
            if (lastValue !== value && (value === 1 || value === 2 || value === true || value === false)) {
                const tagData = {
                    tagDataName: tag.tagDataName,
                    value: value,
                    unit: tag.unit || "",
                    dataDateTime: Date.now(),
                    remark: "Value Changed"
                };

                if (this.pendingData.has(device.deviceId)) {
                    const existingData = this.pendingData.get(device.deviceId);
                    existingData.tagDataItems.push(tagData);
                } else {
                    const data = {
                        plantCode: device.plantCode,
                        deviceType: device.deviceType,
                        deviceId: device.deviceId,
                        tagDataItems: [tagData]
                    };
                    this.pendingData.set(device.deviceId, data);
                }

                this.lastStoredValue.set(tag.nodeId, value);
                console.log(`Tag data prepared: ${tag.tagDataName} = ${value}`);

                if (this.saveTimers.has(device.deviceId)) {
                    clearTimeout(this.saveTimers.get(device.deviceId));
                }

                const timer = setTimeout(async () => {
                    if (this.pendingData.has(device.deviceId)) {
                        const dataToStore = this.pendingData.get(device.deviceId);
                        
                        // ลง MongoDB
                        await this.collection.insertOne(dataToStore);
                        console.log(`Data stored to MongoDB for device ${device.deviceId}:`, dataToStore.tagDataItems.map(t => `${t.tagDataName}=${t.value}`).join(', '));
                        
                        // ส่ง API
                        try {
                            const response = await axios.post(this.apiUrl, dataToStore, {
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                auth: {
                                    username: 'pdm.system',
                                    password: 'wfZ5_#Tm*up@*8b'
                                }
                            });
                            console.log(`API sent successfully for device ${device.deviceId}:`, response.status);
                        } catch (apiError) {
                            console.error(`API error for device ${device.deviceId}:`, apiError.message);
                        }
                        
                        this.pendingData.delete(device.deviceId);
                        this.saveTimers.delete(device.deviceId);
                    }
                }, 100);
                
                this.saveTimers.set(device.deviceId, timer);
                
            } else {
                console.log(`No change detected or value not allowed for ${tag.nodeId}, value = ${value}`);
            }
            
            this.lastStoredValue.set(tag.nodeId, value);
            
        } catch (error) {
            console.error("Error storing data:", error);
        }
    }

    async disconnect() {
        try {
            this.lastStoredValue.clear();
            this.pendingData.clear();
            
            // ยก้ timers หมด
            for (const timer of this.saveTimers.values()) {
                clearTimeout(timer);
            }
            this.saveTimers.clear();

            if (this.subscription) {
                await this.subscription.terminate();
            }
            if (this.session) {
                await this.session.close();
            }
            if (this.client) {
                await this.client.disconnect();
            }
            if (this.mongoClient) {
                await this.mongoClient.close();
            }
            console.log("Disconnected successfully");
        } catch (error) {
            console.error("Error during disconnect:", error);
        }
    }

    async saveTestData() {
        try {
            // สร้างข้อมูลทดสอบ
            const testData = {
                deviceId: "test-device",
                plantCode: "test-plant",
                deviceType: "test-type",
                timestamp: new Date(),
                tagDataItems: [
                    {
                        tagDataName: "test-tag",
                        value: Math.random() * 100, // ค่าระหว่าง 0-100
                        unit: "test-unit",
                        nodeId: "test-node-id",
                        statusCode: "Good",
                        dataDateTime: Date.now()
                    }
                ]
            };
            
            console.log("Saving test data to MongoDB:", JSON.stringify(testData, null, 2));
            const result = await this.collection.insertOne(testData);
            console.log("Test data saved successfully:", result.insertedId);
            return result;
        } catch (error) {
            console.error("Error saving test data:", error);
            throw error;
        }
    }
}

module.exports = KepwareToMongoDB;



















