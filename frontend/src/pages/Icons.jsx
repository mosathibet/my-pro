import React from 'react';

function Icons() {
  const icons = [
    '🏠', '📊', '📄', '📝', '📋', '📈', '🎯', '👤', '📞', '🔐',
    '⚙️', '💰', '🛒', '💬', '🔔', '🔍', '❤️', '⭐', '🌟', '🎉',
    '📱', '💻', '🖥️', '⌚', '📷', '🎵', '🎮', '🚀', '🌍', '🔥'
  ];

  return (
    <div className="dashboard-content">
      <div className="breadcrumb">
        <span>🎯 Icons</span>
      </div>

      <div className="icons-container">
        <h2>Icon Library</h2>
        <div className="icons-grid">
          {icons.map((icon, index) => (
            <div key={index} className="icon-item">
              <span className="icon">{icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Icons;