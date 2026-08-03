"use client";

import { useEffect } from "react";

/**
 * R3F sizes its canvas from a ResizeObserver on mount. Some environments
 * (backgrounded/non-compositing tabs, very fast initial paints) miss that
 * first observer callback, leaving the canvas at its default 300x150. A
 * synthetic resize event costs nothing and reliably nudges it to re-measure.
 */
export default function useForceResize() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    const timeout = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, []);
}
