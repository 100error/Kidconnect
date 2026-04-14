import { useEffect, useRef } from "react";

/**
 * Hook to handle async operations safely by checking component mount status.
 * Prevents "setState on unmounted component" and other post-unmount crashes.
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Runs an async function only if the component is still mounted.
   * Checks mount status both BEFORE and AFTER the async operation.
   */
  const safeRun = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (!isMountedRef.current) return undefined;

    try {
      const result = await fn();
      if (!isMountedRef.current) return undefined;
      return result;
    } catch (e) {
      console.error("SafeRun Error:", e);
      return undefined;
    }
  };

  return { isMountedRef, safeRun };
}
