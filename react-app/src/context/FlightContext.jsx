import React, { createContext, useContext, useState, useMemo } from 'react';

const FlightContext = createContext();

export function FlightProvider({ children }) {
    // Data and loading states
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // States for 3D player timeline
    const [timeIndex, setTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    async function uploadFile(file) {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use URL from environment variables
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5208';
            
            const response = await fetch(`${baseUrl}/file/load`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error processing file on the server');
            }

            const json = await response.json();
            console.log("File uploaded successfully:", json);
            
            setData(json);
            setTimeIndex(0); // Reset player state on new file
            setIsPlaying(false);
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message);
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    function clearData() {
        setData(null);
        setTimeIndex(0);
        setIsPlaying(false);
        setError(null);
    }

    // Enrich trajectory (adds covered distance for 3D scene and metrics)
    const enrichedTrajectory = useMemo(() => {
        if (!data?.trajectory) return [];
        
        let cumulativeDistance = 0;
        return data.trajectory.map((point, index, array) => {
            let stepDistance = 0;
            if (index > 0) {
                const prev = array[index - 1].pos;
                const curr = point.pos;
                const dx = curr[0] - prev[0];
                const dy = curr[1] - prev[1];
                const dz = curr[2] - prev[2];
                stepDistance = Math.hypot(dx, dy, dz);
                cumulativeDistance += stepDistance;
            }
            return { ...point, distance: cumulativeDistance, stepDistance };
        });
    }, [data]);

    const value = {
        data: enrichedTrajectory,
        summary: data?.summary,
        events: data?.events,
        rawTelemetry: data, // Fallback in case original JSON is needed
        loading,
        error,
        timeIndex,
        setTimeIndex,
        isPlaying,
        setIsPlaying,
        uploadFile,
        clearData
    };

    return (
        <FlightContext.Provider value={value}>
            {children}
        </FlightContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlightContext() {
    return useContext(FlightContext);
}

