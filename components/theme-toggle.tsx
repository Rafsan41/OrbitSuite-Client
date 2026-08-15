"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "orbitsuite-theme";

/**
 * Toggles the `.dark` class the design's palette hangs off. The initial class is
 * set by the inline script in the root layout — this only handles user changes,
 * so there is no flash on load.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const [isDark, setIsDark] = useState(false);

    // Read the applied class rather than storage: the script may have chosen
    // dark from the OS preference with nothing stored yet.
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
        } catch {
            // Private-browsing modes reject writes. Losing the preference on
            // reload is acceptable; breaking the toggle is not.
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={isDark}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md " +
                "border border-line bg-transparent text-sm text-ink-soft " +
                "hover:text-ink " +
                (className ?? "")
            }
        >
            <span aria-hidden>{isDark ? "☀" : "☾"}</span>
            <span className="sr-only">
                {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </span>
        </button>
    );
}
