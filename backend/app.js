const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const opcuaRoutes = require('./routes/opcua');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store WebSocket clients
const wsClients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    wsClients.add(ws);
    
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time data stream',
        timestamp: new Date()
    }));
    
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        wsClients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        wsClients.delete(ws);
    });
});

// Broadcast function
function broadcastToClients(data) {
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(data));
            } catch (error) {
                console.error('Error sending to client:', error);
                wsClients.delete(client);
            }
        }
    });
}

// Make broadcast function available globally
global.broadcastToClients = broadcastToClients;

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        port: PORT, 
        timestamp: new Date().toISOString(),
        wsClients: wsClients.size
    });
});

app.use('/api/opcua', opcuaRoutes);

server.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 OPC UA API: http://localhost:${PORT}/api/opcua`);
    console.log(`🌐 WebSocket server running on ws://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    process.exit(0);
});
