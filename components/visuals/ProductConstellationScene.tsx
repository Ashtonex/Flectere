"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useForceResize from "./useForceResize";
import WatermarkPlane from "./WatermarkPlane";

const NODE_COUNT = 11;
const DUST_COUNT = 180;

function DustField() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      const radius = 1.2 + Math.random() * 3.7;
      const angle = Math.random() * Math.PI * 2;
      values[i * 3] = Math.cos(angle) * radius;
      values[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      values[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    }
    return values;
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.025;
    points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#E8D4A0"
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function ProductSystem() {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const innerRing = useRef<THREE.Mesh>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const links = useRef<THREE.BufferGeometry>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => new Float32Array(NODE_COUNT * 3), []);
  const linePositions = useMemo(() => new Float32Array(NODE_COUNT * 2 * 3), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (group.current) {
      group.current.rotation.y = time * 0.075 + state.pointer.x * 0.16;
      group.current.rotation.x = -0.18 + state.pointer.y * -0.08;
    }

    if (ring.current) ring.current.rotation.z = time * 0.05;
    if (innerRing.current) innerRing.current.rotation.z = -time * 0.085;

    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = (i / NODE_COUNT) * Math.PI * 2 + time * 0.12;
      const radius = 2.55 + Math.sin(time * 0.7 + i) * 0.08;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle * 1.7 + time * 0.18) * 0.35;
      const z = Math.sin(angle) * radius * 0.62;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      dummy.position.set(x, y, z);
      const scale = 0.11 + Math.sin(time * 1.4 + i) * 0.025;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      nodes.current?.setMatrixAt(i, dummy.matrix);

      linePositions[i * 6] = 0;
      linePositions[i * 6 + 1] = 0;
      linePositions[i * 6 + 2] = 0;
      linePositions[i * 6 + 3] = x;
      linePositions[i * 6 + 4] = y;
      linePositions[i * 6 + 5] = z;
    }

    if (nodes.current) nodes.current.instanceMatrix.needsUpdate = true;
    if (links.current) links.current.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <DustField />
      <WatermarkPlane opacity={0.045} size={5.2} position={[0.35, -0.1, -1.7]} />
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.45, 0.006, 8, 160]} />
        <meshBasicMaterial color="#C6A159" transparent opacity={0.42} />
      </mesh>
      <mesh ref={innerRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.004, 8, 128]} />
        <meshBasicMaterial color="#9BA1A8" transparent opacity={0.22} />
      </mesh>
      <lineSegments>
        <bufferGeometry ref={links}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#C6A159" transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
      <instancedMesh ref={nodes} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#E8D4A0" transparent opacity={0.96} />
      </instancedMesh>
      <mesh>
        <icosahedronGeometry args={[0.3, 2]} />
        <meshBasicMaterial color="#F5F0E4" wireframe transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

export default function ProductConstellationScene({ inView = true }: { inView?: boolean }) {
  useForceResize();

  return (
    <Canvas
      frameloop={inView ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.25, 6.8], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ProductSystem />
    </Canvas>
  );
}
