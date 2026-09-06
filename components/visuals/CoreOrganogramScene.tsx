"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useForceResize from "./useForceResize";
import WatermarkPlane from "./WatermarkPlane";

const ARM_COUNT = 11;
const USER_COUNT = 44;
const DUST_COUNT = 260;

type OrbitSeed = {
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  eccentricity: number;
  lift: number;
};

function buildSeeds(count: number, baseRadius: number, radiusStep: number): OrbitSeed[] {
  return Array.from({ length: count }, (_, i) => {
    const band = i % 5;
    const wave = Math.sin(i * 12.9898) * 43758.5453;
    const rand = wave - Math.floor(wave);

    return {
      radius: baseRadius + band * radiusStep + rand * radiusStep,
      speed: 0.055 + (i % 7) * 0.009 + rand * 0.012,
      phase: (i / count) * Math.PI * 2 + rand * 0.7,
      tilt: -0.42 + (i % 6) * 0.16,
      eccentricity: 0.72 + rand * 0.32,
      lift: 0.18 + (i % 4) * 0.08,
    };
  });
}

function MarketDust({ activeLayer }: { activeLayer: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      const band = i % 9;
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.8 + band * 0.22 + Math.random() * 2.6;
      values[i * 3] = Math.cos(angle) * radius;
      values[i * 3 + 1] = (Math.random() - 0.5) * (1.8 + Math.random() * 1.6);
      values[i * 3 + 2] = Math.sin(angle) * radius * (0.46 + Math.random() * 0.42);
    }
    return values;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    pointsRef.current.rotation.y = time * (activeLayer === 2 ? 0.04 : 0.022);
    pointsRef.current.rotation.x = Math.sin(time * 0.13) * 0.04;
    pointsRef.current.rotation.z = Math.cos(time * 0.11) * 0.025;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={activeLayer === 2 ? 0.022 : 0.016}
        color="#DADDE1"
        transparent
        opacity={activeLayer === 2 ? 0.44 : 0.24}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function CoreNetwork({
  activeLayer,
  progressRef,
}: {
  activeLayer: number;
  progressRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.InstancedMesh>(null);
  const usersRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.BufferGeometry>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const armSeeds = useMemo(() => buildSeeds(ARM_COUNT, 1.75, 0.18), []);
  const userSeeds = useMemo(() => buildSeeds(USER_COUNT, 2.95, 0.26), []);
  const armPositions = useMemo(() => new Float32Array(ARM_COUNT * 3), []);
  const userPositions = useMemo(() => new Float32Array(USER_COUNT * 3), []);
  const linePositions = useMemo(
    () => new Float32Array((ARM_COUNT + USER_COUNT) * 2 * 3),
    []
  );

  useFrame((state) => {
    const progress = Math.min(1, Math.max(0, progressRef.current));
    const time = state.clock.elapsedTime;
    const flatten = 1 - Math.min(1, progress * 1.7);
    const open = THREE.MathUtils.smoothstep(progress, 0.08, 0.42);
    const armFocus = activeLayer === 1 ? 1 : 0;
    const userFocus = activeLayer === 2 ? 1 : 0;
    const spin = progress * Math.PI * 3.2;
    const pointerX = state.pointer.x * 3.6;
    const pointerY = state.pointer.y * 2.2;

    if (groupRef.current) {
      groupRef.current.rotation.x =
        THREE.MathUtils.lerp(Math.PI / 2.8, -0.3, open) + state.pointer.y * -0.12;
      groupRef.current.rotation.y = spin + time * 0.1 + state.pointer.x * 0.18;
      groupRef.current.rotation.z = Math.sin(time * 0.18) * 0.08;
      groupRef.current.scale.setScalar(0.86 + open * 0.18);
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = -spin * 0.7 + time * 0.25;
      coreRef.current.rotation.z = time * 0.08;
      const pulse = 1 + Math.sin(time * 1.5) * 0.035;
      coreRef.current.scale.setScalar(pulse);
    }

    let lineIndex = 0;

    for (let i = 0; i < ARM_COUNT; i++) {
      const seed = armSeeds[i];
      const angle = seed.phase + time * seed.speed * (1.1 + armFocus * 3.4);
      const radius = seed.radius + Math.sin(time * 0.7 + i) * (0.04 + armFocus * 0.08);
      const orbitDepth = (0.38 + open * 0.58) * (1 - flatten * 0.34);
      let x = Math.cos(angle) * radius * (1 + seed.eccentricity * 0.1);
      let z = Math.sin(angle) * radius * orbitDepth * seed.eccentricity;
      let y =
        Math.sin(angle + seed.tilt) * seed.lift * open +
        Math.sin(time * 0.9 + i) * 0.06 * armFocus;

      const dx = x - pointerX;
      const dy = y - pointerY;
      const pointerDist = Math.sqrt(dx * dx + dy * dy);
      if (pointerDist < 2.4 && pointerDist > 0.001) {
        const pull = Math.pow(1 - pointerDist / 2.4, 2) * (0.12 + armFocus * 0.16);
        x += (dx / pointerDist) * pull;
        y += (dy / pointerDist) * pull;
        z += pull * 0.7;
      }

      armPositions[i * 3] = x;
      armPositions[i * 3 + 1] = y;
      armPositions[i * 3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.11 + armFocus * 0.035 + Math.sin(time * 1.4 + i) * 0.016);
      dummy.updateMatrix();
      armsRef.current?.setMatrixAt(i, dummy.matrix);

      linePositions[lineIndex++] = 0;
      linePositions[lineIndex++] = 0;
      linePositions[lineIndex++] = 0;
      linePositions[lineIndex++] = x;
      linePositions[lineIndex++] = y;
      linePositions[lineIndex++] = z;
    }

    for (let i = 0; i < USER_COUNT; i++) {
      const seed = userSeeds[i];
      const armIndex = i % ARM_COUNT;
      const angle = seed.phase - time * seed.speed * (0.52 + armFocus * 0.22);
      const scatter = 1 + userFocus * 0.18 + Math.sin(time * 0.22 + i) * 0.025;
      const radius = seed.radius * scatter;
      let x = Math.cos(angle) * radius * (0.84 + seed.eccentricity * 0.18);
      let z =
        Math.sin(angle) *
        radius *
        (0.3 + open * 0.62) *
        (1 - flatten * 0.28) *
        seed.eccentricity;
      let y =
        Math.cos(angle * 1.7 + seed.tilt) * seed.lift * 1.8 * open +
        Math.sin(time * 0.35 + i) * 0.08;

      const dx = x - pointerX;
      const dy = y - pointerY;
      const pointerDist = Math.sqrt(dx * dx + dy * dy);
      if (pointerDist < 2.9 && pointerDist > 0.001) {
        const scatterForce = Math.pow(1 - pointerDist / 2.9, 2) * (0.1 + userFocus * 0.18);
        x += (dx / pointerDist) * scatterForce;
        y += (dy / pointerDist) * scatterForce;
        z += scatterForce * 0.55;
      }

      userPositions[i * 3] = x;
      userPositions[i * 3 + 1] = y;
      userPositions[i * 3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.043 + userFocus * 0.012 + Math.sin(time * 1.8 + i) * 0.007);
      dummy.updateMatrix();
      usersRef.current?.setMatrixAt(i, dummy.matrix);

      const ax = armPositions[armIndex * 3];
      const ay = armPositions[armIndex * 3 + 1];
      const az = armPositions[armIndex * 3 + 2];

      linePositions[lineIndex++] = ax;
      linePositions[lineIndex++] = ay;
      linePositions[lineIndex++] = az;
      linePositions[lineIndex++] = x;
      linePositions[lineIndex++] = y;
      linePositions[lineIndex++] = z;
    }

    if (armsRef.current) armsRef.current.instanceMatrix.needsUpdate = true;
    if (usersRef.current) usersRef.current.instanceMatrix.needsUpdate = true;
    if (linesRef.current) linesRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <MarketDust activeLayer={activeLayer} />
      <WatermarkPlane
        position={[0, 0, -0.05]}
        rotation={[0, 0, 0]}
        size={1.45}
        opacity={0.42}
        spinSpeed={0}
      />
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.34, 3]} />
        <meshBasicMaterial color="#F5F0E4" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.006, 8, 160]} />
        <meshBasicMaterial color="#C6A159" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2.35, 0.08, 0.4]}>
        <torusGeometry args={[1.78, 0.004, 8, 180]} />
        <meshBasicMaterial color="#9BA1A8" transparent opacity={activeLayer === 1 ? 0.34 : 0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2.7, -0.2, -0.55]}>
        <torusGeometry args={[2.32, 0.004, 8, 220]} />
        <meshBasicMaterial color="#C6A159" transparent opacity={activeLayer === 1 ? 0.3 : 0.14} />
      </mesh>
      <mesh rotation={[Math.PI / 2.1, 0.24, 0.9]}>
        <torusGeometry args={[3.22, 0.003, 8, 220]} />
        <meshBasicMaterial color="#DADDE1" transparent opacity={activeLayer === 2 ? 0.2 : 0.09} />
      </mesh>
      <lineSegments>
        <bufferGeometry ref={linesRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#C6A159"
          transparent
          opacity={activeLayer === 2 ? 0.12 : 0.2}
          depthWrite={false}
        />
      </lineSegments>
      <instancedMesh ref={armsRef} args={[undefined, undefined, ARM_COUNT]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={activeLayer === 1 ? "#F2DFB3" : "#E8D4A0"}
          transparent
          opacity={0.96}
        />
      </instancedMesh>
      <instancedMesh ref={usersRef} args={[undefined, undefined, USER_COUNT]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={activeLayer === 2 ? "#DADDE1" : "#9BA1A8"}
          transparent
          opacity={activeLayer === 1 ? 0.48 : 0.62}
        />
      </instancedMesh>
    </group>
  );
}

function CameraRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame((state) => {
    const progress = Math.min(1, Math.max(0, progressRef.current));
    camera.position.x += (Math.sin(progress * Math.PI * 1.2) * 1.5 - camera.position.x) * 0.05;
    camera.position.y += ((0.2 + progress * 0.6) - camera.position.y) * 0.05;
    camera.position.z += ((7.4 - progress * 1.15) - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function CoreOrganogramScene({
  activeLayer,
  progressRef,
}: {
  activeLayer: number;
  progressRef: MutableRefObject<number>;
}) {
  useForceResize();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 7.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.55} />
      <CameraRig progressRef={progressRef} />
      <CoreNetwork activeLayer={activeLayer} progressRef={progressRef} />
    </Canvas>
  );
}
