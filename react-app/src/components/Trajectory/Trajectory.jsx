import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

function Trajectory({ trajectory }) {
  const { points, colors } = useMemo(() => {
    if (!trajectory?.length) return { points: [], colors: [] };

    // Find the maximum velocity to correctly set up the gradient
    const maxVel = trajectory.reduce((max, p) => Math.max(max, p.vel), 0) || 1;

    const pts = [];
    const cols = [];

    const colorSlow = new THREE.Color("#00d1ff"); // Blue (slow)
    const colorFast = new THREE.Color("#ff3b30"); // Red (max speed)

    trajectory.forEach((p) => {
      const [x, y, z] = p.pos;
      pts.push(new THREE.Vector3(x, z, -y));

      // Determine the color for the current point based on speed
      const speedRatio = p.vel / maxVel;
      const pointColor = colorSlow.clone().lerp(colorFast, speedRatio);

      // Drei Line accepts an array of colors in [r, g, b] format
      cols.push([pointColor.r, pointColor.g, pointColor.b]);
    });

    return { points: pts, colors: cols };
  }, [trajectory]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      vertexColors={colors} // Enable multicolored line
      lineWidth={4} // Line thickness
      transparent={true}
      opacity={0.9}
    />
  );
}

export default Trajectory;
