"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * True once hydrated, false during SSR and the first client render — expressed
 * as an external store rather than a `useState` + `useEffect` pair, which reads
 * as a cascading render to the React lint and to the compiler.
 */
const neverChanges = () => () => {};
const useIsHydrated = () =>
    useSyncExternalStore(
        neverChanges,
        () => true,
        () => false,
    );

/**
 * Flips between light and dark. next-themes owns the `.dark` class, the storage
 * key and the pre-paint script, so this is only the control.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();

    // `resolvedTheme` is undefined on the server and on the very first client
    // render, because the answer lives in localStorage and the OS. Rendering an
    // icon before it resolves would guess wrong half the time and visibly flip
    // after hydration, so the button stays iconless until it is known.
    const mounted = useIsHydrated();

    const isDark = resolvedTheme === "dark";
    const label = isDark ? "Switch to light mode" : "Switch to dark mode";

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-pressed={mounted ? isDark : undefined}
            title={mounted ? label : undefined}
            className={cn(className)}
        >
            {mounted && (isDark ? <SunIcon /> : <MoonIcon />)}
            <span className="sr-only">{mounted ? label : "Toggle theme"}</span>
        </Button>
    );
}
