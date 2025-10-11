import { useCallback, useEffect, useRef } from "react";
import { SCHEDULER_CONSTANTS } from "../constants";
import { useScheduler } from "../context/SchedulerContext";

interface PerformanceOptions {
  debounceMs?: number;
  throttleMs?: number;
  batchSize?: number;
}

interface UsePerformanceReturn {
  measurePerformance: (operation: string) => () => void;
  memoize: <T extends (...args: any[]) => any>(fn: T) => T;
}

export function usePerformance(): UsePerformanceReturn {
  const measurePerformance = (operation: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;

      if (import.meta.env.DEV) {
        console.log(`Performance [${operation}]: ${duration.toFixed(2)}ms`);
      }
    };
  };

  const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      cache.set(key, result);

      return result;
    }) as T;
  };

  return {
    measurePerformance,
    memoize,
  };
}
