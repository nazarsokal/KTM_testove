import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFlightContext } from './FlightContext';

const AIContext = createContext();

export function AIProvider({ children }) {
    const { rawTelemetry, loading: flightLoading } = useFlightContext();
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (rawTelemetry && !flightLoading) {
            analyzeTelemetry(rawTelemetry);
        } else if (!rawTelemetry) {
            setAiAnalysis(null);
        }
    }, [rawTelemetry, flightLoading]);
    async function analyzeTelemetry(telemetry) {
        setLoading(true);
        setError(null);

        try {
            const rawPoints = telemetry.trajectory || [];
            const totalPoints = rawPoints.length;

            // --- ЛОГІКА "РОЗУМНОГО" ПІДБОРУ ТОЧОК ---

            // Використовуємо Set, щоб уникнути дублікатів індексів
            const bestIndices = new Set();

            if (totalPoints > 0) {
                // 1. Обов'язкові точки: Початок і Кінець
                bestIndices.add(0);
                bestIndices.add(totalPoints - 1);

                // 2. Знаходимо індекси екстремумів
                let maxAltIdx = 0, maxVelIdx = 0, maxAccIdx = 0;
                let maxAlt = -Infinity, maxVel = -Infinity;

                rawPoints.forEach((p, idx) => {
                    if (p.pos[2] > maxAlt) { maxAlt = p.pos[2]; maxAltIdx = idx; }
                    if (p.vel > maxVel) { maxVel = p.vel; maxVelIdx = idx; }
                });

                bestIndices.add(maxAltIdx);
                bestIndices.add(maxVelIdx);

                // 3. Додаємо точки, де відбулися події (якщо в події є час t)
                (telemetry.events || []).forEach(event => {
                    // Намагаємось знайти індекс точки за часом події
                    const eventTime = typeof event === 'object' ? event.t : null;
                    if (eventTime !== null) {
                        const closestIdx = rawPoints.findIndex(p => Math.abs(p.t - eventTime) < 0.1);
                        if (closestIdx !== -1) bestIndices.add(closestIdx);
                    }
                });

                // 4. Заповнюємо решту місць рівномірними точками, доки не буде 21
                const remainingCount = 21 - bestIndices.size;
                if (remainingCount > 0) {
                    const step = totalPoints / (remainingCount + 1);
                    for (let i = 1; i <= remainingCount; i++) {
                        bestIndices.add(Math.round(i * step));
                    }
                }
            }

            // Перетворюємо індекси в масив, сортуємо їх за часом і беремо самі точки
            const sampledPoints = Array.from(bestIndices)
                .sort((a, b) => a - b)
                .slice(0, 21) // На всяк випадок обрізаємо до 21
                .map(idx => rawPoints[idx]);

            // --- ФОРМУВАННЯ ЗАПИТУ ---
            const requestBody = {
                summaryRequest: {
                    max_vertical_speed: telemetry.summary?.max_vertical_speed || 0,
                    max_horizontal_speed: telemetry.summary?.max_horizontal_speed || 0,
                    max_acceleration: telemetry.summary?.max_acceleration || 0,
                    max_altitude: telemetry.summary?.max_altitude || 0,
                    total_distance: telemetry.summary?.total_distance || 0,
                    duration_seconds: telemetry.summary?.duration_seconds || 0
                },
                events: (telemetry.events || []).map(e =>
                    typeof e === 'string' ? e : (e.name || e.message || "Event")
                ),
                points: sampledPoints.map(p => ({
                    t: p.t,
                    pos: p.pos,
                    vel: p.vel,
                    att: p.att
                }))
            };

            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5208';

            const response = await fetch(`${baseUrl}/ai/result/Ukrainian`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI error: ${response.status}`);
            }

            const json = await response.json();
            setAiAnalysis(json);
            console.log(json);
        } catch (err) {
            console.error("AI Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    const value = { aiAnalysis, loading, error };
    return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext() {
    return useContext(AIContext);
}