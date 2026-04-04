import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, unit, icon }) => {
    return (
        <div className="stats-card">
            <div className="card-header">
                <div className="icon-container">{icon}</div>
            </div>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <div className="card-value-container">
                    <span className="card-value">{value}</span>
                    <span className="card-unit">{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;