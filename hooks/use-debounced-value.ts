"use client";

import { useEffect, useState } from "react";

/**
 * Holds a value back until it stops changing.
 *
 * Every list screen has a search box feeding a query key. Without this, "acme"
 * is five renders and five requests, four of them already stale before they
 * land — and the table flickers through each result set on the way.
 *
 * The input stays controlled by its own state, so typing is never delayed; only
 * the value the query reads lags behind.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}
