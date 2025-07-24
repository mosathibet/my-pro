// Add historical data endpoint with date range
router.post('/historical-data', async (req, res) => {
  try {
    const { serverId, startDate, endDate, limit = 1000 } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log(`Fetching historical data from ${start} to ${end}`);
    
    const readings = await TagDataReading.find({
      serverId: serverId,
      timestamp: {
        $gte: start,
        $lte: end
      }
    })
    .sort({ timestamp: 1 })
    .limit(limit);
    
    res.json({
      success: true,
      data: readings,
      count: readings.length,
      dateRange: { start, end }
    });
    
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});