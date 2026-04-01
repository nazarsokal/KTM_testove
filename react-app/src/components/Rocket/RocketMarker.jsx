function RocketMarker ({ position, quaternion, scale = [3, 3, 3] }) {
  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Rocket body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 3, 16]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Rocket nose */}
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.4, 1.0, 16]} />
        <meshStandardMaterial color="#ff3333" roughness={0.5} />
      </mesh>
      
      {/* Nozzle / Flame */}
      <mesh position={[0, -1.6, 0]}>
        <coneGeometry args={[0.3, 0.8, 16]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
    </group>
  );
};

export default RocketMarker;