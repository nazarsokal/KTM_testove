import React from "react";

function RocketMarker({ position, quaternion, vehicleType, scale = 1 }) {
  if (["Quadcopter", "Drone"].includes(vehicleType)) {
    return (
      <group position={position} quaternion={quaternion} scale={scale}>
        {/* Drone body. NO ROTATION NEEDED, it is already flat */}
        <mesh>
          <boxGeometry args={[1.5, 0.4, 1.5]} />
          <meshStandardMaterial
            color="#00d1ff"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        {/* Red front marker (nose on -Z axis) */}
        <mesh position={[0, 0.2, -0.8]}>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Rotate the rocket 90 degrees because cylinders are naturally vertical */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Rocket nose */}
        <mesh position={[0, 1, 0]}>
          <coneGeometry args={[0.4, 2, 16]} />
          <meshStandardMaterial
            color="#ff3b30"
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        {/* Rocket body */}
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
