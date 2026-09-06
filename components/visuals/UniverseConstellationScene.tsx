"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

export type StarHealth = "nominal" | "warning" | "critical";

export type SectorOrb = {
  key: string;
  name: string;
  latinMotto: string;
  sector: string;
  status: "Priority" | "Planned";
  color: string;
  orbitRadius: number;
  eccentricity: number;
  inclination: number;
  speed: number;
  tenants: number;
  mrr: number;
  health: StarHealth;
  description: string;
};

export const SECTOR_ORBS: SectorOrb[] = [
  {
    key: "aedificium",
    name: "AEDIFICIUM",
    latinMotto: "Fundamenta Firma",
    sector: "Construction & Infrastructure",
    status: "Priority",
    color: "#C6A159",
    orbitRadius: 3.5,
    eccentricity: 0.05,
    inclination: 0.08,
    speed: 0.04,
    tenants: 14,
    mrr: 7000,
    health: "nominal",
    description: "Multi-site ERP, plant machinery telematics, and subcontractor compliance engine.",
  },
  {
    key: "vectura",
    name: "VECTURA",
    latinMotto: "Cursus Perpetuus",
    sector: "Logistics & Fleets",
    status: "Priority",
    color: "#38bdf8",
    orbitRadius: 4.4,
    eccentricity: 0.08,
    inclination: -0.11,
    speed: 0.033,
    tenants: 8,
    mrr: 3200,
    health: "nominal",
    description: "Automated route optimization, real-time fuel telemetry, and driver dispatch.",
  },
  {
    key: "stirps",
    name: "STIRPS",
    latinMotto: "Radix Mercatus",
    sector: "Wholesale & POS",
    status: "Priority",
    color: "#34d399",
    orbitRadius: 5.2,
    eccentricity: 0.04,
    inclination: 0.14,
    speed: 0.028,
    tenants: 6,
    mrr: 2400,
    health: "nominal",
    description: "Distributed warehouse inventory sync, fiscal receipting, and multi-currency point-of-sale.",
  },
  {
    key: "shield",
    name: "SHIELD",
    latinMotto: "Tutela Invicta",
    sector: "Underwriting & Risk",
    status: "Priority",
    color: "#fbbf24",
    orbitRadius: 6.0,
    eccentricity: 0.07,
    inclination: -0.06,
    speed: 0.024,
    tenants: 3,
    mrr: 1500,
    health: "nominal",
    description: "Algorithmic policy underwriting and instant fraud-resistant claims verification.",
  },
  {
    key: "cuniculus",
    name: "CUNICULUS",
    latinMotto: "Ex Terra Vis",
    sector: "Mining & Downtime",
    status: "Priority",
    color: "#f97316",
    orbitRadius: 6.8,
    eccentricity: 0.06,
    inclination: 0.17,
    speed: 0.021,
    tenants: 4,
    mrr: 3600,
    health: "nominal",
    description: "Crusher & mill telemetry, shaft safety monitoring, and mineral shipment reconciliation.",
  },
  {
    key: "cropus",
    name: "CROPUS",
    latinMotto: "Mensis Abundans",
    sector: "Agriculture & Cold Chain",
    status: "Priority",
    color: "#a3e635",
    orbitRadius: 7.6,
    eccentricity: 0.04,
    inclination: -0.13,
    speed: 0.018,
    tenants: 2,
    mrr: 900,
    health: "nominal",
    description: "Crop yield projection, soil telemetry, and export produce tracking.",
  },
  {
    key: "fabrica",
    name: "FABRICA",
    latinMotto: "Fabrilis Ars",
    sector: "Manufacturing & QC",
    status: "Priority",
    color: "#e879f9",
    orbitRadius: 8.4,
    eccentricity: 0.08,
    inclination: 0.09,
    speed: 0.016,
    tenants: 2,
    mrr: 1200,
    health: "nominal",
    description: "Production line cadence, batch defect detection, and raw material intake.",
  },
  {
    key: "potentia",
    name: "POTENTIA",
    latinMotto: "Lux et Vigilia",
    sector: "Energy Utilities & Grids",
    status: "Priority",
    color: "#f59e0b",
    orbitRadius: 9.1,
    eccentricity: 0.06,
    inclination: -0.15,
    speed: 0.014,
    tenants: 1,
    mrr: 600,
    health: "nominal",
    description: "Peak shaving balancing, microgrid dispatch, and commercial solar monitoring.",
  },
  {
    key: "salus",
    name: "SALUS",
    latinMotto: "Sanitas Omnium",
    sector: "Healthcare & Veterinary",
    status: "Planned",
    color: "#c084fc",
    orbitRadius: 9.8,
    eccentricity: 0.05,
    inclination: 0.11,
    speed: 0.012,
    tenants: 0,
    mrr: 0,
    health: "nominal",
    description: "Electronic health records, appointment triage, and pharmaceutical inventory.",
  },
  {
    key: "doctrina",
    name: "DOCTRINA",
    latinMotto: "Sapientia Suprema",
    sector: "Educational Platforms",
    status: "Planned",
    color: "#818cf8",
    orbitRadius: 10.5,
    eccentricity: 0.07,
    inclination: -0.08,
    speed: 0.010,
    tenants: 0,
    mrr: 0,
    health: "nominal",
    description: "School fee billing, student grade books, and secure examination intake.",
  },
  {
    key: "argentaria",
    name: "ARGENTARIA",
    latinMotto: "Fides Aurea",
    sector: "Banking & Micro-Lending",
    status: "Planned",
    color: "#e2e8f0",
    orbitRadius: 11.2,
    eccentricity: 0.06,
    inclination: 0.13,
    speed: 0.009,
    tenants: 0,
    mrr: 0,
    health: "nominal",
    description: "Loan servicing ledger, savings account automation, and credit risk scoring.",
  },
];

// ============================================================================
// 1. NATURAL SCATTERED 3D STARFIELD (2,500 Purely Distributed Stars - No S-Curve)
// ============================================================================
function MilkyWayStarfield() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cGold = new THREE.Color("#C6A159");
    const cCyan = new THREE.Color("#38bdf8");
    const cWhite = new THREE.Color("#FFFFFF");
    const cAmber = new THREE.Color("#FFF2CC");

    for (let i = 0; i < count; i++) {
      // Natural spherical random distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.0 + Math.pow(Math.random(), 0.75) * 18.0; // Deep spherical volume

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = (r * Math.cos(phi)) * 0.4; // slightly flattened galactic plane
      pos[i * 3 + 2] = r * sinPhi * Math.sin(theta);

      const pick = Math.random();
      const c = pick > 0.88 ? cAmber : pick > 0.65 ? cGold : pick > 0.45 ? cCyan : cWhite;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.003; // calm cosmic drift
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// 2. INCLINED ELLIPTICAL ORBITS
// ============================================================================
function OrganicOrbitRing({ orb }: { orb: SectorOrb }) {
  const line = useMemo(() => {
    const points = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      const a = orb.orbitRadius * (1 + orb.eccentricity);
      const b = orb.orbitRadius * (1 - orb.eccentricity);
      const px = Math.cos(th) * a;
      const pz = Math.sin(th) * b;
      const py = Math.sin(th) * (orb.orbitRadius * orb.inclination);
      points.push(new THREE.Vector3(px, py, pz));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: orb.health === "critical" ? "#ef4444" : orb.color,
      transparent: true,
      opacity: orb.health === "critical" ? 0.4 : 0.14,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geometry, material);
  }, [orb]);

  return <primitive object={line} />;
}

// ============================================================================
// 3. GYROSCOPIC CORE (Flectēre Singularity with Overload Physics)
// ============================================================================
function CentralCore({ isOverloaded }: { isOverloaded: boolean }) {
  const ring1 = useRef<THREE.Group>(null);
  const ring2 = useRef<THREE.Group>(null);
  const ring3 = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const mult = isOverloaded ? 2.5 : 0.4;
    const t = state.clock.elapsedTime * mult;

    if (ring1.current) ring1.current.rotation.x = t * 0.3;
    if (ring2.current) ring2.current.rotation.y = t * 0.4;
    if (ring3.current) ring3.current.rotation.z = -t * 0.25;

    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (isOverloaded ? 8 : 1.5)) * (isOverloaded ? 0.18 : 0.05);
      coreRef.current.scale.set(pulse, pulse, pulse);
      coreRef.current.rotation.y = t * 0.5;
    }

    if (lightRef.current) {
      lightRef.current.intensity = isOverloaded ? 7.0 : 4.0;
    }
  });

  const coreColor = isOverloaded ? "#ef4444" : "#C6A159";

  return (
    <group>
      <group ref={ring1}>
        <mesh>
          <torusGeometry args={[1.55, 0.015, 16, 64]} />
          <meshBasicMaterial color={coreColor} transparent opacity={0.65} />
        </mesh>
      </group>

      <group ref={ring2} rotation={[Math.PI / 4, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.4, 0.012, 16, 64]} />
          <meshBasicMaterial color={isOverloaded ? "#f87171" : "#FFF1C2"} transparent opacity={0.55} />
        </mesh>
      </group>

      <group ref={ring3} rotation={[0, Math.PI / 4, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[1.25, 0.012, 16, 64]} />
          <meshBasicMaterial color={coreColor} transparent opacity={0.45} />
        </mesh>
      </group>

      <mesh ref={coreRef}>
        <dodecahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={isOverloaded ? "#dc2626" : "#FDE047"}
          emissiveIntensity={isOverloaded ? 2.5 : 1.2}
          wireframe
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={isOverloaded ? "#fee2e2" : "#FFFFFF"} />
      </mesh>

      <pointLight ref={lightRef} color={isOverloaded ? "#ef4444" : "#FFE699"} intensity={4} distance={18} decay={2} />
    </group>
  );
}

// ============================================================================
// 4. PLANETARY ARM (With Incident & Dying Star Telemetry)
// ============================================================================
function PlanetaryArm({
  orb,
  isSelected,
  onSelect,
}: {
  orb: SectorOrb;
  isSelected: boolean;
  onSelect: (orb: SectorOrb) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isCritical = orb.health === "critical";
  const isWarning = orb.health === "warning";
  const starColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : orb.color;

  useFrame((state) => {
    // Majestic, calm cosmic pacing
    const t = state.clock.elapsedTime * orb.speed;
    const a = orb.orbitRadius * (1 + orb.eccentricity);
    const b = orb.orbitRadius * (1 - orb.eccentricity);

    const x = Math.cos(t) * a;
    const z = Math.sin(t) * b;
    const y = Math.sin(t) * (orb.orbitRadius * orb.inclination);

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.01;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.005;
    }
  });

  const size = isSelected ? 0.38 : hovered ? 0.32 : 0.24;

  return (
    <group ref={groupRef}>
      <mesh
        ref={planetRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(orb);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={isCritical ? 2.5 : isSelected ? 1.6 : 0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Planetary Astrolabe Ring */}
      <group ref={ringRef} rotation={[0.4, 0, 0.2]}>
        <mesh>
          <torusGeometry args={[size * 1.5, 0.01, 16, 48]} />
          <meshBasicMaterial
            color={starColor}
            transparent
            opacity={isSelected || isCritical ? 0.85 : 0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Selected Indicator Reticle */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.8, size * 1.9, 32]} />
          <meshBasicMaterial color={starColor} side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 5. CAMERA FLIGHT RIG WITH PARALLAX INERTIA
// ============================================================================
function CameraRig({ selectedOrb }: { selectedOrb: SectorOrb | null }) {
  const { camera, pointer } = useThree();

  useFrame(() => {
    const mouseX = pointer.x * 0.8;
    const mouseY = pointer.y * 0.5;

    const targetX = mouseX;
    const targetY = (selectedOrb ? 6.5 : 10.5) + mouseY;
    const targetZ = selectedOrb ? 8.5 : 13.5;

    camera.position.x += (targetX - camera.position.x) * 0.025;
    camera.position.y += (targetY - camera.position.y) * 0.025;
    camera.position.z += (targetZ - camera.position.z) * 0.025;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ============================================================================
// MAIN UNIVERSE CANVAS EXPORT
// ============================================================================
export default function UniverseConstellationScene({
  selectedOrb,
  onSelectOrb,
  isOverloaded = false,
}: {
  selectedOrb: SectorOrb | null;
  onSelectOrb: (orb: SectorOrb) => void;
  isOverloaded?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 11, 14], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.18} />

      <CameraRig selectedOrb={selectedOrb} />

      {/* 1. Milky Way Spiral Starfield */}
      <MilkyWayStarfield />

      {/* 2. Gyroscopic Core Singularity */}
      <CentralCore isOverloaded={isOverloaded} />

      {/* 3. 11 Organic Orbital Lines */}
      {SECTOR_ORBS.map((orb) => (
        <OrganicOrbitRing key={`ring-${orb.key}`} orb={orb} />
      ))}

      {/* 4. 11 Planetary Sector Platforms */}
      {SECTOR_ORBS.map((orb) => (
        <PlanetaryArm
          key={`arm-${orb.key}`}
          orb={orb}
          isSelected={selectedOrb?.key === orb.key}
          onSelect={onSelectOrb}
        />
      ))}

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.25} intensity={0.8} radius={0.6} />
        <Vignette eskil={false} offset={0.15} darkness={0.88} />
        <Noise opacity={0.015} />
      </EffectComposer>
    </Canvas>
  );
}
