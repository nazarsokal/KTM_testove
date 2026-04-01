function Metric({ label, value, unit }) {
  return (
    <span>
      {label}:{" "}
      <span className="highlight">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
    </span>
  );
}

function Timeline({ trajectory, timeIndex, setTimeIndex, isPlaying, setIsPlaying }) {
  if (!trajectory || trajectory.length === 0) return null;

  const currentPoint = trajectory[timeIndex];
  const [x, y, z] = currentPoint.pos;
  const isAtEnd = timeIndex >= trajectory.length - 1;

  // Calculate straight-line distance from origin (0, 0, 0)
  const displacement = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

  const handlePlayPause = () => {
    if (!isPlaying && isAtEnd) {
      setTimeIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e) => {
    setTimeIndex(parseInt(e.target.value, 10));
    setIsPlaying(false);
  };

  return (
    <div className="timeline-container">
      <button className="play-button" onClick={handlePlayPause}>
        {isPlaying ? "PAUSE" : "PLAY"}
      </button>

      <div className="slider-wrapper">
        <input
          type="range"
          className="time-slider"
          min="0"
          max={trajectory.length - 1}
          value={timeIndex}
          onChange={handleSliderChange}
        />
        <div className="time-info">
          <Metric label="Time" value={`T+${currentPoint.t.toFixed(1)}`} unit="s" />
          <Metric label="Speed" value={currentPoint.vel.toFixed(1)} unit="m/s" />
          <Metric label="Alt" value={z.toFixed(1)} unit="m" />
          <Metric label="Path" value={currentPoint.distance.toFixed(1)} unit="m" />
          <Metric label="Displacement" value={displacement.toFixed(1)} unit="m" />
        </div>
      </div>
    </div>
  );
}

export default Timeline;