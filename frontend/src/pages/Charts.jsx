import React from 'react';

function Charts() {
  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>📈 Charts</span>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Line Chart</h3>
          <div className="chart-placeholder">
            <p>Line Chart Visualization</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Bar Chart</h3>
          <div className="chart-placeholder">
            <p>Bar Chart Visualization</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Pie Chart</h3>
          <div className="chart-placeholder">
            <p>Pie Chart Visualization</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Area Chart</h3>
          <div className="chart-placeholder">
            <p>Area Chart Visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Charts;