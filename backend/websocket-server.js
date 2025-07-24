const WebSocket = require('ws');

class WebSocketServer {
    constructor(port = 8080) {
        this.wss = new WebSocket.Server({ port });
        this.clients = new Set();
        
        console.log(`WebSocket server starting on port ${port}`);
        
        this.wss.on('connection', (ws) => {
            console.log('New client connected to WebSocket');
            this.clients.add(ws);
            
            // Send initial connection message
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to real-time data stream',
                timestamp: new Date()
            }));
            
            ws.on('close', () => {
                console.log('Client disconnected from WebSocket');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket client error:', error);
                this.clients.delete(ws);
            });
        });
        
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
        
        console.log(`WebSocket server running on port ${port}`);
    }
    
    broadcast(data) {
        if (this.clients.size === 0) {
            console.log('No WebSocket clients connected');
            return;
        }
        
        const message = JSON.stringify(data);
        console.log(`Broadcasting to ${this.clients.size} clients:`, data);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error sending message to client:', error);
                    this.clients.delete(client);
                }
            } else {
                this.clients.delete(client);
            }
        });
    }
}

module.exports = WebSocketServer;


