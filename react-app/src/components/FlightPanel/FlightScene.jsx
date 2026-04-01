import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Trajectory from "../Trajectory/Trajectory";
import RocketMarker from "../Rocket/RocketMarker";

function toSceneVector(position) {
  return new THREE.Vector3(position[0], position[2], -position[1]);
}

function FlightScene({ trajectory, timeIndex }) {
  // Compute rocket position and orientation from trajectory.
  const { rocketPosition, rocketQuaternion } = useMemo(() => {
    if (!trajectory || trajectory.length === 0) {
      return {
        rocketPosition: new THREE.Vector3(0, 0, 0),
        rocketQuaternion: new THREE.Quaternion(),
      };
    }

    const currentPoint = trajectory[timeIndex];
    const nextPoint = trajectory[Math.min(timeIndex + 1, trajectory.length - 1)];

  const pos = toSceneVector(currentPoint.pos);
  const nextPos = toSceneVector(nextPoint.pos);

    const direction = new THREE.Vector3().subVectors(nextPos, pos).normalize();

    if (direction.lengthSq() === 0) {
      direction.set(0, 1, 0);
    }

    const quaternion = new THREE.Quaternion();
    const upVector = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(upVector, direction);

    return { rocketPosition: pos, rocketQuaternion: quaternion };
  }, [trajectory, timeIndex]);

  return (
    <Canvas camera={{ position: [50, 50, 50], fov: 50 }}>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      <gridHelper args={[1000, 50, 0x444444, 0x222222]} />

      <Trajectory flightPoints={trajectory} />

      {/* Adjust scale if the marker appears too small in the scene. */}
      <RocketMarker position={rocketPosition} quaternion={rocketQuaternion} scale={[5, 5, 5]} />
    </Canvas>
  );
}

export default FlightScene;