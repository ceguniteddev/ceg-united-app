import { useState, useEffect, useRef } from "react";

// ============================================
// useCountUp — Animated Number Counter Hook
// ============================================
// Smoothly animates a number from 0 to the target value.
// Uses ease-out-cubic for a premium deceleration feel.
//
// Usage:
//   const displayValue = useCountUp(100000, 1200)
//   return <span>{displayValue}</span>

export function useCountUp(end: number, duration: number = 1200): number {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // Cancel any running animation
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    // If target is 0, set immediately
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;

    function animate(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.max(0, Math.round(end * eased));
      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return count;
}
