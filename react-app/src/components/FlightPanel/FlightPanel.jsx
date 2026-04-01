import { useEffect, useMemo, useState } from "react";
import { useFlightData } from "../../hooks/useFlightData";
import FlightScene from "./FlightScene";
import Timeline from "./Timeline";

import "./FlightPanel.css";

const PLAYBACK_INTERVAL_MS = 500;

function enrichTrajectoryWithDistance(trajectory = []) {
  let cumulativeDistance = 0;

  return trajectory.map((point, index, points) => {
    if (index > 0) {
      const previousPosition = points[index - 1].pos;
      const currentPosition = point.pos;

      const dx = currentPosition[0] - previousPosition[0];
      const dy = currentPosition[1] - previousPosition[1];
      const dz = currentPosition[2] - previousPosition[2];
      const segmentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      cumulativeDistance += segmentDistance;
    }

    return { ...point, distance: cumulativeDistance };
  });
}

function FlightPanel() {
  const { data, loading } = useFlightData();
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const enrichedTrajectory = useMemo(
    () => enrichTrajectoryWithDistance(data?.trajectory ?? []),
    [data?.trajectory],
  );

  // Keep time index valid when a new trajectory is loaded.
  if (timeIndex >= enrichedTrajectory.length && enrichedTrajectory.length > 0) {
    setTimeIndex(0);
    setIsPlaying(false);
  }

  // Playback tick.
  useEffect(() => {
    if (!isPlaying || enrichedTrajectory.length === 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeIndex((previousIndex) => {
        if (previousIndex >= enrichedTrajectory.length - 1) {
          setIsPlaying(false);
          return previousIndex;
        }

        return previousIndex + 1;
      });
    }, PLAYBACK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, enrichedTrajectory.length]);

  if (loading) {
    return <div className="loading-screen">Loading telemetry...</div>;
  }

  if (!data) {
    return (
      <div className="loading-screen" style={{ color: "red" }}>
        Failed to load data
      </div>
    );
  }

  return (
    <div className="flight-panel-container">
      <FlightScene trajectory={enrichedTrajectory} timeIndex={timeIndex} />

      <Timeline
        trajectory={enrichedTrajectory}
        timeIndex={timeIndex}
        setTimeIndex={setTimeIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
}

export default FlightPanel;