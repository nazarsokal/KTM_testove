import React from 'react';
import StatsCard from "./StatsCard.jsx";
import { useTranslation } from 'react-i18next';
import './StatsCard.css';
import './MetricsGrid.css';

// Іконки можна взяти з бібліотеки lucide-react або react-icons
import { Navigation, Gauge, Zap, Clock } from 'lucide-react';

const MetricsGrid = () => {
    const { t } = useTranslation();

    const mockData = [
        {
            title: t("metrics.totalDistance"),
            value: "12.47",
            unit: t("units.kilometers"),
            icon: <Navigation size={20} color="#00d1ff" />,
            trend: "+2.3%"
        },
        {
            title: t("metrics.maxSpeed"),
            value: "68.5",
            unit: `${t("units.meters")}/${t("units.seconds")}`,
            icon: <Gauge size={20} color="#00d1ff" />,
            trend: "↑ 12%"
        },
        {
            title: t("metrics.maxAcceleration"),
            value: "4.82",
            unit: `${t("units.meters")}/${t("units.seconds")}²`,
            icon: <Zap size={20} color="#00d1ff" />,
            trend: null
        },
        {
            title: t("metrics.flightDuration"),
            value: "24:18",
            unit: t("units.minutes"),
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