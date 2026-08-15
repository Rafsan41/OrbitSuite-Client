"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface CountUpProps {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

const format = (n: number, decimals: number) =>
    n.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

/**
 * Counts a number up when it scrolls into view.
 *
 * GSAP rather than a dedicated counter library — it is already here for the
 * reveals and the cube, it tweens a plain object as happily as a DOM node, and
 * the ScrollTrigger is the same one the rest of the page uses. A second
 * animation library for one number would mean a second easing vocabulary and a
 * second scroll listener to keep in step with Lenis.
 */
export function CountUp({
    value,
    decimals = 0,
    prefix = "",
    suffix = "",
    className,
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const final = `${prefix}${format(value, decimals)}${suffix}`;

    useGSAP(
        () => {
            const el = ref.current;
            if (!el) return;
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }

            // Tween a plain object and write the formatted result out each
            // frame — thousands separators and decimal places have to be
            // reapplied every tick, so the raw number cannot go straight in.
            const counter = { n: 0 };
            const paint = () => {
                el.textContent = `${prefix}${format(counter.n, decimals)}${suffix}`;
            };

            // Zeroed here rather than in the markup: the server renders the real
            // figure, so it is present without JavaScript and for anything
            // reading the page. This only blanks it once the count is certain
            // to run.
            paint();

            gsap.to(counter, {
                n: value,
                duration: 1.8,
                ease: "power2.out",
                onUpdate: paint,
                scrollTrigger: { trigger: el, start: "top 90%", once: true },
            });
        },
        { scope: ref },
    );

    return (
        <span className={className}>
            {/*
             * The animating copy is hidden from assistive tech — a number
             * changing sixty times a second is noise to a screen reader. The
             * static copy beside it carries the real value.
             */}
            <span ref={ref} aria-hidden>
                {final}
            </span>
            <span className="sr-only">{final}</span>
        </span>
    );
}
