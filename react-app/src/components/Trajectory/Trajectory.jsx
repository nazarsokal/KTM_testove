import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

import './Trajectory.css';

function Trajectory ({ flightPoints }) {
  // Use useMemo to avoid recalculating math on every render
  const { points, colors } = useMemo(() => {
    if (!flightPoints || flightPoints.length === 0) {
      return { points: [], colors: [] };
    }

    const pts = [];
    const cols = [];

    // Find max speed to build a relative scale
    const maxVel = Math.max(...flightPoints.map(p => p.vel));
    // Protect against division by zero when speed is constant/zero
    const safeMaxVel = maxVel > 0 ? maxVel : 1; 

    flightPoints.forEach(p => {
      // 1. Build point coordinates (swap Y and Z for scene orientation)
      pts.push(new THREE.Vector3(p.pos[0], p.pos[2], -p.pos[1]));

      // 2. Compute color based on speed
      const speedRatio = p.vel / safeMaxVel; // Value in range 0.0..1.0
      
      const color = new THREE.Color();
      
      // Use HSL color model (Hue, Saturation, Lightness).
      // Hue 0.7 is blue (slow), 0.0 is red (max speed).
      // 0.7 * (1 - speedRatio) creates a smooth blue -> red gradient.
      color.setHSL(0.7 * (1 - speedRatio), 1, 0.5);
      
      // <Line> from @react-three/drei expects colors as [[r, g, b], ...]
      cols.push([color.r, color.g, color.b]);
    });

    return { points: pts, colors: cols };
  }, [flightPoints]);

  if (points.length === 0) return null;

  return (
    <group>
      <Line
        points={points}
        vertexColors={colors} // Apply per-point color array
        lineWidth={4}         // Slightly thicker line for better gradient visibility
        transparent={true}
        opacity={0.9}
      />
    </group>
  );
};

export default Trajectory;