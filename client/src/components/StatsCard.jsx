import React from 'react';

const StatsCard = ({ title, value, icon, gradient, subtitle }) => {
  return (
    <div className={`card stats-card shadow-sm border-0 h-100 ${gradient ? `bg-gradient-${gradient}` : 'bg-white'}`}>
      <div className="card-body p-4 d-flex align-items-center justify-content-between">
        <div>
          <h6 className="card-subtitle text-muted text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.05em', fontSize: '0.8rem' }}>
            {title}
          </h6>
          <h2 className="card-title fw-bold mb-1 text-dark">{value}</h2>
          {subtitle && <small className="text-secondary">{subtitle}</small>}
        </div>
        <div className="stats-icon-wrapper rounded-circle d-flex align-items-center justify-content-center">
          <span className="stats-icon">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
