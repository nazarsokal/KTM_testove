import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import RocketMarker from "../Rocket/RocketMarker";
import Trajectory from "../Trajectory/Trajectory";
import { useFlightContext } from "../../context/FlightContext";
import { Crosshair, Maximize, Minimize, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

function CameraController({ targetPosition, mode }) {
  const controlsRef = useRef();

  useFrame(() => {
    if (!controlsRef.current) return;
    if (mode !== "free") {
      controlsRef.current.target.lerp(targetPosition, 0.08);
      controlsRef.current.update();
    }
  });

  return <OrbitControls ref={controlsRef} makeDefault maxDistance={150000} />;
}

function FlightScene({ onToggleFullscreen, isFullscreen }) {
  const {
    data: trajectory,
    events,
    timeIndex,
    rawTelemetry,
  } = useFlightContext();
  const { t } = useTranslation();
  const vehicleType = rawTelemetry?.metadata?.vehicle_type || "Rocket";

  const [camMode, setCamMode] = useState("rocket");

  // РЯТІВНА ОПТИМІЗАЦІЯ: Обчислюємо події лише один раз. 
  // Це розблокує процесор і поверне відчуття реальної швидкості.
  const memoizedEvents = useMemo(() => {
    if (!trajectory?.length || !events?.length) return [];
    return events.map((ev) => {
      const point = trajectory.find((p) => p.t >= ev.t) || trajectory[trajectory.length - 1];
      return {
        name: ev.event || ev.name || "Event",
        pos: new THREE.Vector3(point.pos[0], point.pos[2], -point.pos[1])
      };
    });
  }, [trajectory, events]);

  const { centerPosition, minY } = useMemo(() => {
    if (!trajectory?.length)
      return { centerPosition: new THREE.Vector3(0, 0, 0), minY: 0 };

    let minX = Infinity, maxX = -Infinity, minYVal = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

    trajectory.forEach((p) => {
      const x = p.pos[0], y = p.pos[2], z = -p.pos[1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minYVal) minYVal = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });

    return {
      centerPosition: new THREE.Vector3((minX + maxX) / 2, (minYVal + maxY) / 2, (minZ + maxZ) / 2),
      minY: minYVal,
    };
  }, [trajectory]);

  const { currentPosition, currentQuaternion, currentRoll } = useMemo(() => {
    if (!trajectory?.length)
      return {
        currentPosition: new THREE.Vector3(0, 0, 0),
        currentQuaternion: new THREE.Quaternion(),
        currentRoll: 0
      };

    const point = trajectory[timeIndex];
    const pos = new THREE.Vector3(point.pos[0], point.pos[2], -point.pos[1]);
    const quaternion = new THREE.Quaternion();
    let roll = point.att?.[0] || 0;

    const startPoint = trajectory[0];
    const startPos = new THREE.Vector3(startPoint.pos[0], startPoint.pos[2], -startPoint.pos[1]);
    const isPreLaunch = pos.distanceToSquared(startPos) < 0.001;

    if (isPreLaunch && point.att?.length === 3) {
      const euler = new THREE.Euler(point.att[1], point.att[2] + Math.PI, point.att[0], "YXZ");
      quaternion.setFromEuler(euler);
      return { currentPosition: pos, currentQuaternion: quaternion, currentRoll: 0 }; 
    }

    let direction = new THREE.Vector3();
    let isMoving = false;

    if (timeIndex < trajectory.length - 1) {
      const lookAhead = 4;
      const targetIdx = Math.min(timeIndex + lookAhead, trajectory.length - 1);
      const nextPos = new THREE.Vector3(trajectory[targetIdx].pos[0], trajectory[targetIdx].pos[2], -trajectory[targetIdx].pos[1]);

      if (pos.distanceToSquared(nextPos) > 0.001) {
        direction.subVectors(nextPos, pos).normalize();
        isMoving = true;
      }
    }

    if (!isMoving && timeIndex > 0) {
      for (let i = timeIndex - 1; i >= 0; i--) {
        const prevPos = new THREE.Vector3(trajectory[i].pos[0], trajectory[i].pos[2], -trajectory[i].pos[1]);
        if (pos.distanceToSquared(prevPos) > 0.001) {
          direction.subVectors(pos, prevPos).normalize();
          isMoving = true;
          break;
        }
      }
    }

    if (!isMoving) direction.set(0, 1, 0);

    const matrix = new THREE.Matrix4();
    const upVector = Math.abs(direction.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    matrix.lookAt(pos, pos.clone().add(direction), upVector);
    quaternion.setFromRotationMatrix(matrix);

    return { currentPosition: pos, currentQuaternion: quaternion, currentRoll: roll };
  }, [trajectory, timeIndex]);

  const activeTarget = camMode === "overview" ? centerPosition : currentPosition;

  return (
    <div className="scene-wrapper" onPointerDown={() => setCamMode("free")}>
      <div className="camera-controls-overlay">
        <button
          className={`scene-btn ${camMode === "rocket" ? "active" : ""}`}
          onClick={() => setCamMode("rocket")}
          title={t('flightPanel.focusRocket')}
        >
          <Crosshair size={20} />
        </button>
        <button
          className={`scene-btn ${camMode === "overview" ? "active" : ""}`}
          onClick={() => setCamMode("overview")}
          title={t('flightPanel.focusOverview')}
        >
          <Target size={20} />
        </button>
        <div className="scene-divider"></div>
        <button
          className={`scene-btn ${isFullscreen ? "active" : ""}`}
          onClick={onToggleFullscreen}
          title={isFullscreen ? t('flightPanel.exitFullscreen') : t('flightPanel.fullscreen')}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      <Canvas camera={{ position: [200, 300, 500], fov: 50, near: 0.1, far: 500000 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[100, 500, 100]} intensity={1.5} />

        <gridHelper args={[10000, 100, "#30363d", "#161b22"]} position={[0, minY - 20, 0]} />

        {trajectory?.length > 0 && (
          <>
            <Trajectory trajectory={trajectory} />
            <RocketMarker
              position={currentPosition}
              quaternion={currentQuaternion}
              roll={currentRoll}
              vehicleType={vehicleType}
              scale={35}
            />
            <CameraController targetPosition={activeTarget} mode={camMode} />

            {/* Використовуємо оптимізований масив */}
            {memoizedEvents.map((ev, idx) => (
              <Html key={idx} position={ev.pos} center distanceFactor={1500} zIndexRange={[100, 0]}>
                <div className="event-marker">
                  <div className="event-dot"></div>
                  <div className="event-label">{ev.name}</div>
                </div>
              </Html>
            ))}
          </>
        )}
      </Canvas>
    </div>
  );
}

export default FlightScene;