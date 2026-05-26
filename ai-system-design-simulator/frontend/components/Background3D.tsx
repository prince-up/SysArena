"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";

function ParticleSwarm() {
  const ref = useRef<any>(null);
  
  const sphere = useMemo(() => {
    const count = 3000;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      points[i * 3 + 2] = r * Math.cos(phi);
    }
    return points;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 30;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#3b5bff"
          size={0.006}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-[#0b0f1a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,91,255,0.15),transparent_80%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,107,74,0.1),transparent_50%)]" />
      <Canvas camera={{ position: [0, 0, 1.2] }}>
        <ParticleSwarm />
      </Canvas>
    </div>
  );
}
