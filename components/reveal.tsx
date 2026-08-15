"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fades a section up as it enters the viewport.
 *
 * `useGSAP` scopes every tween created inside it to this element and reverts
 * them on unmount, which is what stops ScrollTriggers accumulating across
 * client-side navigations.
 *
 * With `stagger`, the children are animated rather than the wrapper, so a row
 * of cards arrives one after another instead of as a single block.
 */
export function Reveal({
    children,
    stagger = 0,
    y = 24,
    className,
}: {
    children: React.ReactNode;
    /** Seconds between each child. 0 animates them together. */
    stagger?: number;
    y?: number;
    className?: string;
}) {
    const scope = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            // Checked here rather than as an early return at the top of the
            // component, so the elements are never left stuck at opacity 0.
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }

            const targets = stagger > 0 ? scope.current!.children : scope.current!;

            gsap.from(targets, {
                opacity: 0,
                y,
                duration: 0.6,
                ease: "power2.out",
                stagger,
                scrollTrigger: {
                    trigger: scope.current!,
                    // Fires when the element's top reaches 85% down the viewport
                    // — early enough that it has settled by the time it is
                    // comfortably in view.
                    start: "top 85%",
                    once: true,
                },
            });
        },
        { scope },
    );

    return (
        <div ref={scope} className={className}>
            {children}
        </div>
    );
}
