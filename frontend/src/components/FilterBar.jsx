import React, { useState } from 'react';
import Card from './Card';

const FilterBar = ({
  darkMode,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  dateRange,
  setDateRange,
  timeRange,
  setTimeRange,
  onSearch,
  onClear,
  title = "🔍 Filter Data",
  showThaiYear = false,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const availableTags = [
    '3301 - โรงงาน',
    '3302 - โรงงาน', 
    '3303 - คลังค้า'
  ];

  const handleClear = () => {
    setSelectedYear(currentYear);
    setSelectedMonth('all');
    setDateRange({ startDate: '', endDate: '' });
    setSearchText('');
    setSelectedTags([]);
    if (setTimeRange) {
      setTimeRange({ startTime: '', endTime: '' });
    }
    if (onClear) onClear();
  };

  const handleSearch = () => {
    if (onSearch) onSearch();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedYear !== currentYear) count++;
    if (selectedMonth !== 'all') count++;
    if (dateRange.startDate) count++;
    if (dateRange.endDate) count++;
    if (timeRange?.startTime) count++;
    if (timeRange?.endTime) count++;
    if (searchText) count++;
    if (selectedTags.length > 0) count++;
    return count;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  return (
    <div className="relative">
      <Card darkMode={darkMode} className="mb-0" padding={compact ? "p-2" : "p-4"}>
        <div className="flex flex-col gap-2">
          {/* Compact Search Bar and Filter Toggle */}
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหา"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm border rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={toggleExpanded}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-all duration-200 ${
                darkMode
                  ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-xs">⚙️</span>
              <span>กรอง ({getActiveFiltersCount()})</span>
              <span className={`transform transition-transform duration-200 text-xs ${
                isExpanded ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* Expandable Filter Dropdown */}
      {isExpanded && (
        <div className={`absolute top-full right-0 mt-2 w-96 z-50 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-lg border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="p-4 space-y-4">
            {/* โรงงาน/คลัง */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                โรงงาน/คลัง
              </label>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        darkMode
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addTag(e.target.value);
                    e.target.value = '';
                  }
                }}
                className={`w-full px-3 py-2 text-sm border rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">โรงงาน/คลัง</option>
                {availableTags.map((tag, index) => (
                  <option key={index} value={tag} disabled={selectedTags.includes(tag)}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ปี

                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {showThaiYear ? year + 543 : year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  เดือน
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="all">ทั้งหมด</option>
                  {thaiMonths.map((month, index) => (
                    <option key={index + 1} value={(index + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  วันเริ่ม
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  วันสิ้นสุด
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Time Range */}
            {timeRange && setTimeRange && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    เวลาเริ่ม
                  </label>
                  <input
                    type="time"
                    value={timeRange.startTime}
                    onChange={(e) => setTimeRange(prev => ({ ...prev, startTime: e.target.value }))}
                    className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    เวลาสิ้นสุด
                  </label>
                  <input
                    type="time"
                    value={timeRange.endTime}
                    onChange={(e) => setTimeRange(prev => ({ ...prev, endTime: e.target.value }))}
                    className={`w-full px-2 py-1.5 text-sm border rounded-md ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSearch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                🔍 ค้นหา
              </button>
              <button
                onClick={handleClear}
                className={`flex-1 px-4 py-2 text-sm rounded-md border transition-colors duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                🗑️ ล้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
