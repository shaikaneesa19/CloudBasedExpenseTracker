import React from 'react';

export default function SummaryCard({ title, value, meta, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="summary-card">
      <div className="card-top">
        <span className="card-title">{title}</span>
        <div 
          className="card-icon" 
          style={{ 
            backgroundColor: iconBg || 'rgba(99, 102, 241, 0.15)', 
            color: iconColor || '#818cf8' 
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div>
        <div className="card-value">{value}</div>
        {meta && <div className="card-meta">{meta}</div>}
      </div>
    </div>
  );
}
