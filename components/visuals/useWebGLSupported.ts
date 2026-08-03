"use client";

import { useEffect, useState } from "react";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Returns true only when it's safe/desirable to mount a WebGL (R3F) scene:
 * WebGL is available AND the user hasn't asked for reduced motion.
 * Starts false (SSR-safe) and flips after a client-side check.
 */
export default function useWebGLSupported() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setSupported(!reducedMotion && detectWebGL());
  }, []);

  return supported;
}
