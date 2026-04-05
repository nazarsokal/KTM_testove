import React from "react";

function RocketMarker({ position, quaternion, vehicleType, scale = 1 }) {
  if (["Quadcopter", "Drone"].includes(vehicleType)) {
    return (
      <group position={position} quaternion={quaternion} scale={scale}>
        {}
        <mesh>
          <boxGeometry args={[1.5, 0.4, 1.5]} />
          <meshStandardMaterial
            color="#00d1ff"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        {}
        <mesh position={[0, 0.2, -0.8]}>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {}
        <mesh position={[0, 1, 0]}>
          <coneGeometry args={[0.4, 2, 16]} />
          <meshStandardMaterial
            color="#ff3b30"
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        {}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}

export default RocketMarker;
