const express = require('express');
const cors = require('cors');
const opcuaRoutes = require('./routes/opcua');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add OPC UA routes
app.use('/api/opcua', opcuaRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});

const KepwareToMongoDB = require('./kepware-to-mongodb');
const fs = require('fs');
const path = require('path');

async function loadDeviceConfigs() {
    const configDir = path.join(__dirname, 'config');
    const deviceConfigs = [];
    
    try {
        const files = fs.readdirSync(configDir);
        const deviceFiles = files.filter(file => file.startsWith('device-') && file.endsWith('.json'));
        
        for (const file of deviceFiles) {
            const filePath = path.join(configDir, file);
            const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            deviceConfigs.push(configData);
        }
        
        console.log(`Loaded ${deviceConfigs.length} device configurations`);
        return deviceConfigs;
    } catch (error) {
        console.error('Error loading device configs:', error);
        return [];
    }
}

// เล่มส่งข้อมูลทดสอบ
function sendTestData(kepware) {
    setInterval(() => {
        const testData = {
            deviceId: "3301001326",
            tagDataName: "Pressure_Steam",
            value: Math.random() * 10 + 5, // ค่าระหว่าง 5-15
            unit: "Bar",
            timestamp: new Date().toISOString(),
            statusCode: "Good"
        };
        
        console.log('📤 Sending test data:', testData);
        kepware.wsServer.broadcast(testData);
    }, 2000); // ส่ง 2 ข้อมูลต่อ 2 นา
}

async function main() {
    const deviceConfig = await loadDeviceConfigs();

    const kepware = new KepwareToMongoDB(
        "opc.tcp://192.168.1.115:49320",
        "mongodb://localhost:27017",
        deviceConfig
    );

    try {
        await kepware.connect();
        await kepware.createSubscriptions();
        
        // เล่มส่งข้อมูลทดสอบ
        sendTestData(kepware);
        
        console.log("Monitoring started with WebSocket server. Press Ctrl+C to stop.");
    } catch (error) {
        console.error("Error:", error);
        await kepware.disconnect();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    process.exit(0);
});

main();
