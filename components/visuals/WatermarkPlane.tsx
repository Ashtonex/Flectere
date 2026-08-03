"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The Flectēre seal, rendered into the 3D scene as a ghost — never square to
 * the camera, never fully opaque, partly cropped by the frame and partly
 * hidden behind the lattice in front of it. The brief was "never fully
 * revealed"; this loads the texture imperatively (not via suspense) so a
 * missing asset just means no watermark renders, not a broken scene.
 */
// Routed through Next's built-in image optimizer instead of the raw public
// path — the source seal export is a multi-thousand-pixel print file, and a
// background 3D texture has no use for that resolution. This keeps the
// actual bytes the browser downloads small regardless of source file size.
const DEFAULT_WATERMARK_URL =
  "/_next/image?url=%2Fbrand%2Fflectere-seal.png&w=640&q=60";

export default function WatermarkPlane({
  url = DEFAULT_WATERMARK_URL,
  position = [2.6, -1, -4] as [number, number, number],
  rotation = [0.25, 0.4, 0.1] as [number, number, number],
  size = 7,
  opacity = 0.07,
  spinSpeed = 0.015,
}: {
  url?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
  opacity?: number;
  spinSpeed?: number;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    let loaded: THREE.Texture | null = null;

    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => {
        // Asset not present yet — fail silently.
      }
    );

    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
    }
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
