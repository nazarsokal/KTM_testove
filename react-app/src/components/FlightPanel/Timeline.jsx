import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useFlightContext } from "../../context/FlightContext";
import "./FlightPanel.css";

function Timeline() {
  const { data, timeIndex, setTimeIndex, isPlaying, setIsPlaying } =
    useFlightContext();
  const { t } = useTranslation();

  // Auto-play logic
  useEffect(() => {
    let timer;
    if (isPlaying && data?.length && timeIndex < data.length - 1) {
      timer = setInterval(() => {
        setTimeIndex((prevIndex) => {
          if (prevIndex >= data.length - 2) {
            setIsPlaying(false); // Stop at the end
            return data.length - 1;
          }
          return prevIndex + 1;
        });
      }, 50); // Playback speed (50ms = 20 points per second)
    }

    return () => clearInterval(timer);
  }, [isPlaying, data, timeIndex, setTimeIndex, setIsPlaying]);

  if (!data?.length) return null;

  const currentPoint = data[timeIndex];
  const totalPoints = data.length;

  function handleSliderChange(e) {
    setTimeIndex(Number(e.target.value));
    setIsPlaying(false); // Pause if the user manually drags the slider
  }

  return (
    <>
      <div className="player-controls">
        <button
          className="control-btn play-pause-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? t("flightPanel.pause") : t("flightPanel.play")}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="play-icon-offset" />
          )}
        </button>

        <button
          className="control-btn reset-btn"
          onClick={() => {
            setTimeIndex(0);
            setIsPlaying(false);
          }}
          title={t("flightPanel.restart")}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="slider-wrapper">
        <input
          type="range"
          min="0"
          max={totalPoints - 1}
          value={timeIndex}
          onChange={handleSliderChange}
          className="timeline-slider"
        />

        <div className="time-info">
          <span>
            {t("flightPanel.time")}:{" "}
            <span className="highlight">
              T+{currentPoint.t.toFixed(1)}
              {t("units.seconds")}
            </span>
          </span>
          <span>
            {t("flightPanel.speed")}:{" "}
            <span className="highlight">
              {currentPoint.vel.toFixed(1)} {t("units.meters")}/
              {t("units.seconds")}
            </span>
          </span>
          <span>
            {t("flightPanel.altitude")}:{" "}
            <span className="highlight">
              {currentPoint.pos[2].toFixed(1)} {t("units.meters")}
            </span>
          </span>
          <span>
            {t("flightPanel.distance")}:{" "}
            <span className="highlight">
              {(currentPoint.distance / 1000).toFixed(2)}{" "}
              {t("units.kilometers")}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}

export default Timeline;
