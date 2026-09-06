"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useForceResize from "./useForceResize";
import WatermarkPlane from "./WatermarkPlane";

const COLS = 13;
const ROWS = 8;
const COUNT = COLS * ROWS;

function buildStages() {
  const w = 7.5;
  const h = 4.6;
  const sense = new Float32Array(COUNT * 3);
  const shape = new Float32Array(COUNT * 3);
  const shift = new Float32Array(COUNT * 3);
  const scale = new Float32Array(COUNT * 3);
  const core = new Float32Array(COUNT * 3);

  let idx = 0;
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const u = i / (COLS - 1);
      const v = j / (ROWS - 1);
      const x = (u - 0.5) * w;
      const y = (v - 0.5) * h;

      // Stage 1 - Sense: loose, semi-random floating cloud
      const theta = u * Math.PI * 2 + v * 1.7;
      const r = 3.1 + Math.sin(v * 9.1 + u * 5.3) * 0.9;
      sense[idx * 3] = Math.cos(theta) * r * 0.55 + (Math.sin(v * 12.3) * 0.4);
      sense[idx * 3 + 1] = Math.sin(theta) * r * 0.4 + (Math.cos(u * 10.1) * 0.5);
      sense[idx * 3 + 2] = Math.sin(u * 8 + v * 6) * 1.6;

      // Stage 2 - Shape: clean organized grid
      shape[idx * 3] = x;
      shape[idx * 3 + 1] = y;
      shape[idx * 3 + 2] = Math.sin(u * Math.PI) * 0.25;

      // Stage 3 - Shift: flowing twisted vortex
      const twist = u * Math.PI * 1.6;
      shift[idx * 3] = x;
      shift[idx * 3 + 1] = y * Math.cos(twist) - 0.6 * Math.sin(twist);
      shift[idx * 3 + 2] = y * Math.sin(twist) * 0.7 + Math.cos(u * Math.PI * 2) * 0.5;

      // Stage 4 - Scale: expanded, domed outward
      const dome = Math.cos(u * Math.PI - Math.PI / 2) * Math.cos(v * Math.PI - Math.PI / 2);
      scale[idx * 3] = x * 1.45;
      scale[idx * 3 + 1] = y * 1.45;
      scale[idx * 3 + 2] = dome * 1.6;

      // Stage 5 - Core: concentric constellation ring core
      const ringAngle = (idx / COUNT) * Math.PI * 4;
      const ringRadius = 1.2 + (idx % ROWS) * 0.35;
      core[idx * 3] = Math.cos(ringAngle) * ringRadius;
      core[idx * 3 + 1] = Math.sin(ringAngle) * ringRadius;
      core[idx * 3 + 2] = (idx / COUNT - 0.5) * 2.2;

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

  return { stages: [sense, shape, shift, scale, core], segments };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function MorphingLattice({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const { stages, segments } = useMemo(() => buildStages(), []);
  const groupRef = useRef<THREE.Group>(null);
  const pointsGeoRef = useRef<THREE.BufferGeometry>(null);
  const linesGeoRef = useRef<THREE.BufferGeometry>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const current = useRef(new Float32Array(COUNT * 3));

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const linePositions = useMemo(
    () => new Float32Array(segments.length * 2 * 3),
    [segments.length]
  );

  useFrame((state) => {
    const p = Math.min(0.999, Math.max(0, progressRef.current));
    const t = p * (stages.length - 1);
    const seg = Math.floor(t);
    const local = t - seg;
    const from = stages[seg];
    const to = stages[Math.min(seg + 1, stages.length - 1)];
    const time = state.clock.elapsedTime;

    const mx = state.pointer.x * 4.5;
    const my = state.pointer.y * 2.8;

    for (let i = 0; i < COUNT; i++) {
      let x = lerp(from[i * 3], to[i * 3], local);
      let y = lerp(from[i * 3 + 1], to[i * 3 + 1], local);
      let z = lerp(from[i * 3 + 2], to[i * 3 + 2], local) + Math.sin(time * 0.4 + x) * 0.08;

      // Mouse repulsion wave
      const dx = x - mx;
      const dy = y - my;
      const distSq = dx * dx + dy * dy;
      const radius = 2.4;
      if (distSq < radius * radius && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const force = Math.pow(1 - dist / radius, 2) * 0.75;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
        z += force * 0.5;
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

    if (pointsGeoRef.current) pointsGeoRef.current.attributes.position.needsUpdate = true;
    if (linesGeoRef.current) linesGeoRef.current.attributes.position.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.08) * 0.25 + p * 0.8;
      groupRef.current.rotation.x = state.pointer.y * -0.12;
    }

    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(time * 0.5) * 4;
      lightRef.current.position.y = Math.cos(time * 0.4) * 3;
      lightRef.current.position.z = 2 + Math.sin(time * 0.6) * 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} color="#C6A159" intensity={3.0} distance={10} />
      <points>
        <bufferGeometry ref={pointsGeoRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.065} color="#F2DFB3" transparent opacity={0.96} sizeAttenuation depthWrite={false} />
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

function CameraFlight({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    const p = Math.min(0.999, Math.max(0, progressRef.current));
    const targetX = Math.sin(p * Math.PI * 0.5) * 1.8;
    const targetZ = 9.0 - Math.sin(p * Math.PI) * 1.2;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function MethodScene({
  progressRef,
  inView = true,
}: {
  progressRef: MutableRefObject<number>;
  inView?: boolean;
}) {
  useForceResize();
  return (
    <Canvas
      frameloop={inView ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.35} />
      <CameraFlight progressRef={progressRef} />
      <WatermarkPlane
        position={[-2.2, 1.2, -4.5]}
        rotation={[-0.2, -0.35, -0.12]}
        size={6.5}
        opacity={0.055}
      />
      <MorphingLattice progressRef={progressRef} />
    </Canvas>
  );
}
