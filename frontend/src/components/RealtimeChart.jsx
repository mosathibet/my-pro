import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import Card from './Card';
// ลบบรรทัด<|im_start|>้ออก: import opcuaService from '../services/opcuaService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const RealtimeChart = ({ darkMode }) => {
  const [chartData, setChartData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [availableTags, setAvailableTags] = useState([]);
  const [tagColors, setTagColors] = useState({});
  const [timeRange, setTimeRange] = useState('1h');
  const [dataMode, setDataMode] = useState('realtime');
  const [historicalRange, setHistoricalRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '23:59'
  });
  const [loading, setLoading] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const chartRef = useRef(null);
  const tagDropdownRef = useRef(null);
  const maxDataPoints = 100;

  // Helper functions
  const getRandomColor = () => {
    const colors = [
      'rgb(59, 130, 246)', 'rgb(239, 68, 68)', 'rgb(16, 185, 129)', 
      'rgb(245, 158, 11)', 'rgb(139, 92, 246)', 'rgb(6, 182, 212)',
      'rgb(132, 204, 22)', 'rgb(249, 115, 22)', 'rgb(236, 72, 153)', 
      'rgb(99, 102, 241)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getTagDisplayColor = (tagName) => {
    if (tagColors[tagName]) {
      return tagColors[tagName];
    }
    const color = getRandomColor();
    setTagColors(prev => ({ ...prev, [tagName]: color }));
    return color;
  };

  const changeTagColor = (tagName, color) => {
    const rgbColor = `rgb(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)})`;
    setTagColors(prev => ({
      ...prev,
      [tagName]: rgbColor
    }));
  };

  const toggleTag = (tagName) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagName)) {
        newSet.delete(tagName);
      } else {
        newSet.add(tagName);
      }
      return newSet;
    });
  };

  const selectAllTags = () => {
    setSelectedTags(new Set(availableTags));
  };

  const deselectAllTags = () => {
    setSelectedTags(new Set());
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('Connecting...');
    
    try {
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('Connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('Disconnected');
        
        if (!reconnectTimeoutRef.current && dataMode === 'realtime') {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Error');
    }
  };

  const handleRealtimeData = (data) => {
    if (!data.tagDataItems) return;

    const timestamp = new Date(data.dataDateTime);
    
    setChartData(prevData => {
      const newData = { ...prevData };
      
      data.tagDataItems.forEach(tag => {
        const tagName = tag.tagDataName;
        
        if (!newData[tagName]) {
          const color = getTagDisplayColor(tagName);
          newData[tagName] = {
            label: tagName,
            data: [],
            borderColor: color,
            backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 1,
            pointHoverRadius: 4,
          };
        }
        
        newData[tagName].data.push({
          x: timestamp,
          y: typeof tag.value === 'number' ? tag.value : parseFloat(tag.value) || 0
        });
        
        if (newData[tagName].data.length > maxDataPoints) {
          newData[tagName].data = newData[tagName].data.slice(-maxDataPoints);
        }
      });
      
      return newData;
    });

    const newTags = data.tagDataItems.map(tag => tag.tagDataName);
    setAvailableTags(prev => {
      const combined = [...new Set([...prev, ...newTags])];
      return combined;
    });
  };

  // Load historical data
  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${historicalRange.startDate}T${historicalRange.startTime}`);
      const endDateTime = new Date(`${historicalRange.endDate}T${historicalRange.endTime}`);
      
      const response = await fetch('/api/opcua/historical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId: 'server_192_168_1_115',
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          limit: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const historicalData = await response.json();
      
      if (historicalData.success && historicalData.data.length > 0) {
        const historicalChartData = {};
        
        historicalData.data.forEach(reading => {
          reading.tagDataItems.forEach(tag => {
            const tagName = tag.tagDataName;
            const timestamp = new Date(tag.dataDateTime);
            
            if (timestamp >= startDateTime && timestamp <= endDateTime) {
              if (!historicalChartData[tagName]) {
                const color = getRandomColor();
                historicalChartData[tagName] = {
                  label: tagName,
                  data: [],
                  borderColor: color,
                  backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                  tension: 0.3,
                  fill: false,
                  pointRadius: 1,
                  pointHoverRadius: 4,
                };
              }
              
              historicalChartData[tagName].data.push({
                x: timestamp,
                y: typeof tag.value === 'number' ? tag.value : parseFloat(tag.value) || 0
              });
            }
          });
        });
        
        Object.keys(historicalChartData).forEach(tagName => {
          historicalChartData[tagName].data.sort((a, b) => a.x - b.x);
        });
        
        setChartData(historicalChartData);
        const tags = Object.keys(historicalChartData);
        setAvailableTags(tags);
        setSelectedTags(new Set(tags));
      } else {
        setChartData({});
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      setChartData({});
    } finally {
      setLoading(false);
    }
  };

  // Switch between realtime and historical mode
  const switchDataMode = (mode) => {
    setDataMode(mode);
    if (mode === 'historical') {
      if (wsRef.current) {
        wsRef.current.close();
      }
      loadHistoricalData();
    } else {
      connectWebSocket();
      setChartData({});
    }
  };

  // Reset zoom function
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (dataMode === 'realtime') {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dataMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MM/dd HH:mm',
            day: 'MM/dd',
          },
          tooltipFormat: 'yyyy/MM/dd HH:mm:ss',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Filter chart data based on selected tags
  const filteredChartData = Object.keys(chartData)
    .filter(tagName => selectedTags.has(tagName))
    .reduce((filtered, tagName) => {
      filtered[tagName] = {
        ...chartData[tagName],
        borderColor: getTagDisplayColor(tagName),
        backgroundColor: getTagDisplayColor(tagName).replace('rgb', 'rgba').replace(')', ', 0.1)')
      };
      return filtered;
    }, {});

  const datasets = Object.values(filteredChartData);
  const data = { datasets: datasets };

  return (
    <Card darkMode={darkMode} className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Real-time Chart
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm ${
          connectionStatus === 'Connected' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : connectionStatus === 'Connecting...'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {connectionStatus}
        </div>
      </div>

      {/* Mode Switch */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => switchDataMode('realtime')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            dataMode === 'realtime'
              ? darkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Real-time
        </button>
        <button
          onClick={() => switchDataMode('historical')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            dataMode === 'historical'
              ? darkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Historical
        </button>
        <button
          onClick={resetZoom}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Reset Zoom
        </button>
      </div>

      {/* Tag Filter Section */}
      {availableTags.length > 0 && (
        <div className="mb-4 relative" ref={tagDropdownRef}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                📊 เลือกข้อมูล ({selectedTags.size})
              </span>
              
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>Tags</span>
                  <span className={`transform transition-transform text-xs ${
                    isTagDropdownOpen ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </span>
              </button>

              <div className="flex gap-1">
                <button
                  onClick={selectAllTags}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  เลือกหมด
                </button>
                <button
                  onClick={deselectAllTags}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  ยกยกยก้งหมด
                </button>
              </div>
            </div>
            
            {dataMode === 'realtime' && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ช่วงเวลา:
                </span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className={`px-2 py-1 text-sm border rounded ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="15m">15 นา</option>
                  <option value="30m">30 นา ส</option>
                  <option value="1h">1 น่วโมง</option>
                  <option value="3h">3 น่วโมง</option>
                  <option value="6h">6 น่วโมง</option>
                  <option value="12h">12 น่วโมง</option>
                  <option value="24h">24 น่วโมง</option>
                </select>
              </div>
            )}
          </div>

          {selectedTags.size > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {Array.from(selectedTags).map(tagName => (
                <div
                  key={tagName}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    darkMode
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-600'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getTagDisplayColor(tagName) }}
                  />
                  <span className="max-w-24 truncate" title={tagName}>
                    {tagName}
                  </span>
                  <button
                    onClick={() => toggleTag(tagName)}
                    className={`ml-1 hover:bg-red-500 hover:text-white rounded-full w-3 h-3 flex items-center justify-center text-xs ${
                      darkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {isTagDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 z-50 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border rounded-lg shadow-lg max-h-64 overflow-y-auto`}>
              <div className="p-2">
                <div className="grid grid-cols-1 gap-1">
                  {availableTags.map(tagName => (
                    <div
                      key={tagName}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedTags.has(tagName)
                          ? darkMode
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => toggleTag(tagName)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.has(tagName)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: getTagDisplayColor(tagName) }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor: selectedTags.has(tagName) ? getTagDisplayColor(tagName) : 'transparent',
                          borderColor: getTagDisplayColor(tagName)
                        }}
                      />
                      <span className="text-sm flex-1" title={tagName}>
                        {tagName}
                      </span>
                      <input
                        type="color"
                        value={getTagDisplayColor(tagName).match(/#[0-9a-f]{6}/i)?.[0] || '#3b82f6'}
                        onChange={(e) => changeTagColor(tagName, e.target.value)}
                        className="w-5 h-5 rounded border-0 cursor-pointer"
                        title="เปลี่ยน"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ height: '400px' }}>
        {loading ? (
          <div className={`flex items-center justify-center h-full ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div>โหลดข้อมูล...</div>
            </div>
          </div>
        ) : datasets.length > 0 ? (
          <Line ref={chartRef} data={data} options={options} />
        ) : (
          <div className={`flex items-center justify-center h-full ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>รอข้อมูล Real-time...</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RealtimeChart;





