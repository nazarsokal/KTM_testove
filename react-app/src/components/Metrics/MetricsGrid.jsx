import React from 'react';
import StatsCard from "./StatsCard.jsx";
import './StatsCard.css';
import './MetricsGrid.css';

// Іконки можна взяти з бібліотеки lucide-react або react-icons
import { Navigation, Gauge, Zap, Clock } from 'lucide-react';

const MetricsGrid = () => {
    const mockData = [
        {
            title: "Total Distance (Haversine)",
            value: "12.47",
            unit: "km",
            icon: <Navigation size={20} color="#00d1ff" />,
            trend: "+2.3%"
        },
        {
            title: "Max Speed (Trapezoidal)",
            value: "68.5",
            unit: "m/s",
            icon: <Gauge size={20} color="#00d1ff" />,
            trend: "↑ 12%"
        },
        {
            title: "Max Acceleration",
            value: "4.82",
            unit: "m/s²",
            icon: <Zap size={20} color="#00d1ff" />,
            trend: null
        },
        {
            title: "Flight Duration",
            value: "24:18",
            unit: "min",
            icon: <Clock size={20} color="#00d1ff" />,
            trend: null
        }
    ];

    return (
        <div className="metrics-grid">
            {mockData.map((item, index) => (
                <StatsCard
                    key={index}
                    title={item.title}
                    value={item.value}
                    unit={item.unit}
                    icon={item.icon}
                    trend={item.trend}
                />
            ))}
        </div>
    );
};

export default MetricsGrid;