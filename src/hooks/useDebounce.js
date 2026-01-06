/**
 * Debounce Hook
 * Prevents rapid function calls (e.g., double-clicks on buttons)
 */

import { useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
export const useDebounce = (fn, delay = 300) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
};

/**
 * Hook for preventing rapid button clicks
 * @param {Function} fn - Function to call
 * @param {number} delay - Minimum time between calls (default: 500ms)
 * @returns {Object} { execute: Function, isPending: boolean }
 */
export const useThrottle = (fn, delay = 500) => {
  const lastCallRef = useRef(0);
  const isPendingRef = useRef(false);

  const execute = useCallback(
    async (...args) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall < delay) {
        return; // Too soon, ignore
      }

      if (isPendingRef.current) {
        return; // Already executing
      }

      lastCallRef.current = now;
      isPendingRef.current = true;

      try {
        await fn(...args);
      } finally {
        // Reset after delay to allow next call
        setTimeout(() => {
          isPendingRef.current = false;
        }, delay);
      }
    },
    [fn, delay]
  );

  return {
    execute,
    isPending: isPendingRef.current,
  };
};

export default useDebounce;
