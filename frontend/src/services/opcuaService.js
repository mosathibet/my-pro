const API_BASE_URL = 'http://localhost:3001';

class OPCUAService {
  async getLatestReadings(serverId, limit = 100) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/opcua/latest-readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          limit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  async getHistoricalData(serverId, startDate, endDate, limit = 1000) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/opcua/historical-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          startDate,
          endDate,
          limit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return { success: false, data: [], error: error.message };
    }
  }
}

export default new OPCUAService();

