import { useRef, useState, useEffect } from "react";
import FlightScene from "./FlightScene";
import Timeline from "./Timeline";
import "./FlightPanel.css";

function FlightPanel() {
    const panelRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            panelRef.current?.requestFullscreen().catch(err => {
                console.error("Fullscreen mode error:", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Listen for the Esc key
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div ref={panelRef} className={`flight-panel-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
            <FlightScene 
                onToggleFullscreen={toggleFullscreen} 
                isFullscreen={isFullscreen} 
            />
            <div className="timeline-container">
                <Timeline />
            </div>
        </div>
    );
}

export default FlightPanel;