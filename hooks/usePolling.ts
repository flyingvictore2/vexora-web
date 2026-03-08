import { useEffect, useRef } from "react";

/**
 * usePolling - Calls a callback function immediately and at a regular interval.
 * Automatically clears the interval when the component unmounts.
 *
 * @param callback - The async function to call on each tick.
 * @param intervalMs - Milliseconds between each poll (default: 60000 = 1 min).
 * @param deps - Additional dependencies that should restart the interval.
 */
export function usePolling(
    callback: () => void | Promise<void>,
    intervalMs: number = 60000,
    deps: any[] = []
) {
    const callbackRef = useRef(callback);

    // Keep ref up to date so the interval always uses the latest callback
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        // Run immediately on mount / dep change
        callbackRef.current();

        const interval = setInterval(() => {
            callbackRef.current();
        }, intervalMs);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, ...deps]);
}
