import { useEffect, useRef, useState } from 'react';

/**
 * Throttles a value update using requestAnimationFrame
 * Limits updates to ~60fps to prevent expensive renders from blocking the UI
 */
export function useThrottledValue<T>(value: T, throttleMs: number = 16): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<T>(value);

  useEffect(() => {
    pendingValueRef.current = value;

    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= throttleMs) {
      // Update immediately if enough time has passed
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      // Schedule an update
      rafRef.current = requestAnimationFrame(() => {
        setThrottledValue(pendingValueRef.current);
        lastUpdateRef.current = Date.now();
        rafRef.current = null;
      });
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, throttleMs]);

  return throttledValue;
}
