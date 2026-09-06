"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useForceResize from "./useForceResize";
import WatermarkPlane from "./WatermarkPlane";

const COLS = 16;
const ROWS = 10;
const COUNT = COLS * ROWS;
const INTRO_SECONDS = 2.4;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function buildLattice() {
  const targets = new Float32Array(COUNT * 3);
  const starts = new Float32Array(COUNT * 3);
  const w = 9;
  const h = 5.4;

  let idx = 0;
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const u = i / (COLS - 1);
      const v = j / (ROWS - 1);
      const x = (u - 0.5) * w;
      const y = (v - 0.5) * h;
      const z = Math.sin(u * Math.PI * 1.4) * 0.9 + Math.cos(v * Math.PI) * 0.4;

      targets[idx * 3] = x;
      targets[idx * 3 + 1] = y;
      targets[idx * 3 + 2] = z;

      starts[idx * 3] = (Math.random() - 0.5) * 16;
      starts[idx * 3 + 1] = (Math.random() - 0.5) * 10;
      starts[idx * 3 + 2] = (Math.random() - 0.5) * 10;

      idx++;
    }
  }

  const segments: [number, number][] = [];
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const a = i * ROWS + j;
      if (i < COLS - 1) segments.push([a, a + ROWS]);
      if (j < ROWS - 1) segments.push([a, a + 1]);
    }
  }

  return { targets, starts, segments };
}

function LatticeField() {
  const { targets, starts, segments } = useMemo(() => buildLattice(), []);
  const groupRef = useRef<THREE.Group>(null);
  const pointsGeoRef = useRef<THREE.BufferGeometry>(null);
  const linesGeoRef = useRef<THREE.BufferGeometry>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useRef(0);
  const current = useRef(new Float32Array(starts));
  const rot = useRef({ x: 0, y: 0 });

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const linePositions = useMemo(
    () => new Float32Array(segments.length * 2 * 3),
    [segments.length]
  );

  useFrame((state, delta) => {
    progress.current = Math.min(1, progress.current + delta / INTRO_SECONDS);
    const t = easeOutCubic(progress.current);
    const time = state.clock.elapsedTime;

    // Interactive pointer repulsion coordinates in world space
    const mx = state.pointer.x * 5.2;
    const my = state.pointer.y * 3.1;

    for (let i = 0; i < COUNT; i++) {
      const bx = starts[i * 3] + (targets[i * 3] - starts[i * 3]) * t;
      const by = starts[i * 3 + 1] + (targets[i * 3 + 1] - starts[i * 3 + 1]) * t;
      const bz = starts[i * 3 + 2] + (targets[i * 3 + 2] - starts[i * 3 + 2]) * t;

      const bend = Math.sin(time * 0.5 + bx * 0.6) * 0.18 * t;
      let x = bx;
      let y = by + bend;
      let z = bz + Math.cos(time * 0.35 + by * 0.5) * 0.12 * t;

      // Mouse repulsion field
      const dx = x - mx;
      const dy = y - my;
      const distSq = dx * dx + dy * dy;
      const radius = 2.8;
      if (distSq < radius * radius && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const force = Math.pow(1 - dist / radius, 2) * 0.95 * t;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
        z += force * 0.7;
      }

      current.current[i * 3] = x;
      current.current[i * 3 + 1] = y;
      current.current[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    segments.forEach(([a, b], i) => {
      linePositions[i * 6] = current.current[a * 3];
      linePositions[i * 6 + 1] = current.current[a * 3 + 1];
      linePositions[i * 6 + 2] = current.current[a * 3 + 2];
      linePositions[i * 6 + 3] = current.current[b * 3];
      linePositions[i * 6 + 4] = current.current[b * 3 + 1];
      linePositions[i * 6 + 5] = current.current[b * 3 + 2];
    });

    if (pointsGeoRef.current) {
      pointsGeoRef.current.attributes.position.needsUpdate = true;
    }
    if (linesGeoRef.current) {
      linesGeoRef.current.attributes.position.needsUpdate = true;
    }

    if (groupRef.current) {
      const targetY = state.pointer.x * 0.35 + time * 0.03;
      const targetX = state.pointer.y * -0.18;
      rot.current.y += (targetY - rot.current.y) * 0.04;
      rot.current.x += (targetX - rot.current.x) * 0.04;
      groupRef.current.rotation.y = rot.current.y;
      groupRef.current.rotation.x = rot.current.x;
    }

    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(time * 0.7) * 4.5;
      lightRef.current.position.y = Math.cos(time * 0.5) * 2.8;
      lightRef.current.position.z = 2.5 + Math.sin(time * 0.4) * 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} color="#C6A159" intensity={3.5} distance={12} />
      <points>
        <bufferGeometry ref={pointsGeoRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#F2DFB3"
          transparent
          opacity={0.98}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry ref={linesGeoRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#9BA1A8" transparent opacity={0.36} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ inView = true }: { inView?: boolean }) {
  useForceResize();
  return (
    <Canvas
      frameloop={inView ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <Rig />
      <WatermarkPlane />
      <LatticeField />
    </Canvas>
  );
}
