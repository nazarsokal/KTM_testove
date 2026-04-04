import React from 'react';
import StatsCard from "./StatsCard.jsx";
import { useTranslation } from 'react-i18next';
import './StatsCard.css';
import './MetricsGrid.css';

// Іконки можна взяти з бібліотеки lucide-react або react-icons
import { Navigation, Gauge, Zap, Clock } from 'lucide-react';
import { useFlightContext } from '../../context/FlightContext.jsx';

const MetricsGrid = () => {
    const { summary } = useFlightContext();
    const { t } = useTranslation();

    const formatDuration = (seconds) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const metrics = [
        {
            title: t("metrics.totalDistance"),
            // converts to kilometers
            value: summary?.total_distance ? (summary.total_distance / 1000).toFixed(2) : "0.00",
            unit: t("units.kilometers"),
            icon: <Navigation size={20} color="#00d1ff" />
        },
        {
            title: t("metrics.maxSpeed"),
            value: summary?.max_horizontal_speed ? summary.max_horizontal_speed.toFixed(1) : "0.0",
            unit: `${t("units.meters")}/${t("units.seconds")}`,
            icon: <Gauge size={20} color="#00d1ff" />
        },
        {
            title: t("metrics.maxAcceleration"),
            value: summary?.max_acceleration ? summary.max_acceleration.toFixed(2) : "0.00",
            unit: `${t("units.meters")}/${t("units.seconds")}²`,
            icon: <Zap size={20} color="#00d1ff" />
        },
        {
            title: t("metrics.flightDuration"),
            value: formatDuration(summary?.duration_seconds),
            unit: t("units.minutes"),
            icon: <Clock size={20} color="#00d1ff" />
        }
    ];

    return (
        <div className="metrics-grid">
            {metrics.map((item, index) => (
                <StatsCard
                    // metrics array doesn't get mutated, so it's okay to use index as a key
                    key={index} 
                    title={item.title}
                    value={item.value}
                    unit={item.unit}
                    icon={item.icon}
                />
            ))}
        </div>
    );
};

export default MetricsGrid;