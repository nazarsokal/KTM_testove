import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import RocketMarker from "../Rocket/RocketMarker";
import Trajectory from "../Trajectory/Trajectory";
import { useFlightContext } from "../../context/FlightContext";
import { Crosshair, Maximize, Minimize, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

function CameraInitializer({ center, span, cameraPos }) {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && span > 0) {
      camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      initialized.current = true;
    }
  }, [center, span, cameraPos, camera]);

  return null;
}

function CameraController({ targetPosition, mode }) {
  const controlsRef = useRef();

  useFrame(() => {
    if (!controlsRef.current) return;
    if (mode !== "free") {
      controlsRef.current.target.lerp(targetPosition, 0.08);
      controlsRef.current.update();
    }
  });

  return <OrbitControls ref={controlsRef} makeDefault maxDistance={1000000} />;
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

  const [camMode, setCamMode] = useState("overview");

  const { centerPosition, minY, initialCameraPos, trajectorySpan } = useMemo(() => {
    if (!trajectory?.length)
      return { 
        centerPosition: new THREE.Vector3(0, 0, 0), 
        minY: 0, 
        initialCameraPos: [200, 300, 500],
        trajectorySpan: 0
      };

    let minX = Infinity, maxX = -Infinity, minYVal = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let minX = Infinity, maxX = -Infinity, minYVal = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

    trajectory.forEach((p) => {
      const x = p.pos[0], y = p.pos[2], z = -p.pos[1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minYVal) minYVal = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });

    const center = new THREE.Vector3((minX + maxX) / 2, (minYVal + maxY) / 2, (minZ + maxZ) / 2);
    
    const sizeX = maxX - minX;
    const sizeY = maxY - minYVal;
    const sizeZ = maxZ - minZ;
    const maxSpan = Math.max(sizeX, sizeY, sizeZ);
    
    const dist = maxSpan > 0 ? maxSpan * 1.5 : 500;
    
    let camX, camZ;
    if (sizeZ > sizeX) {
      camX = center.x + dist;
      camZ = center.z; 
    } else {
      camX = center.x;
      camZ = center.z + dist;
    }

    return {
      centerPosition: center,
      minY: minYVal,
      initialCameraPos: [camX, center.y + maxSpan * 0.3, camZ],
      trajectorySpan: maxSpan
    };
  }, [trajectory]);

  const { currentPosition, currentQuaternion, currentRoll } = useMemo(() => {
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
    const roll = point.att?.[0] || 0;

    const startPoint = trajectory[0];
    const startPos = new THREE.Vector3(startPoint.pos[0], startPoint.pos[2], -startPoint.pos[1]);
    const isPreLaunch = pos.distanceToSquared(startPos) < 0.01;

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

  // НОВА ЛОГІКА: Розраховуємо позиції івентів, щоб вони не накладалися і були вище/нижче
  const eventMarkers = useMemo(() => {
    if (!trajectory?.length || !events?.length) return [];
    
    const markers = [];
    // Змінив класи, щоб позиціонувати 'Max Altitude' завжди зверху
    const cssClasses = ['pos-tr', 'pos-tl', 'pos-br', 'pos-bl']; 
    const threshold = Math.max(trajectorySpan * 0.15, 50);

    events.forEach((ev) => {
      const point = trajectory.find((p) => p.t >= ev.t) || trajectory[trajectory.length - 1];
      const pos = new THREE.Vector3(point.pos[0], point.pos[2], -point.pos[1]);

      const closeCount = markers.filter(m => m.pos.distanceTo(pos) < threshold).length;
      
      let posClass = cssClasses[closeCount % 4];
      
      // Жорстке правило для Max Altitude: завжди зверху (pos-tr або pos-tl)
      const eventName = ev.event || ev.name || "Event";
      if (eventName.toLowerCase().includes("altitude") || eventName.toLowerCase().includes("apogee")) {
        posClass = cssClasses[closeCount % 2]; // 0 або 1 (top-right або top-left)
      }

      markers.push({
        ...ev,
        pos,
        posClass
      });
    });

    return markers;
  }, [trajectory, events, trajectorySpan]);

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

      <Canvas camera={{ position: initialCameraPos, fov: 50, near: 0.1, far: 2000000 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[100, 500, 100]} intensity={1.5} />

        <gridHelper args={[20000, 100, "#30363d", "#161b22"]} position={[0, minY - 20, 0]} />

        {trajectory?.length > 0 && (
          <>
            <Trajectory trajectory={trajectory} />
            <RocketMarker
              position={currentPosition}
              quaternion={currentQuaternion}
              roll={currentRoll}
              roll={currentRoll}
              vehicleType={vehicleType}
              scale={35}
            />
            
            <CameraInitializer 
              center={centerPosition} 
              span={trajectorySpan} 
              cameraPos={initialCameraPos} 
            />
            
            <CameraController targetPosition={activeTarget} mode={camMode} />

            {eventMarkers.map((ev, idx) => (
              <Html key={idx} position={ev.pos} center distanceFactor={2000} zIndexRange={[100, 0]}>
                <div className="event-marker">
                  <div className="event-dot"></div>
                  <div className={`event-label ${ev.posClass}`}>
                    {ev.event || ev.name || "Event"}
                  </div>
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