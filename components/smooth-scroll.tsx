"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Lenis takes over the scroll position, which means GSAP's ScrollTrigger can no
 * longer trust the native scroll event — triggers fire late or not at all. The
 * fix is to drive both from one clock: Lenis reports its position to
 * ScrollTrigger, and GSAP's ticker drives Lenis instead of its own rAF loop.
 *
 * Mounted once in the root layout. It renders nothing.
 */
export function SmoothScroll() {
    useEffect(() => {
        // Someone who has asked their OS for less motion should get the
        // browser's own scrolling, not an eased approximation of it.
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (reduced.matches) return;

        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

        lenis.on("scroll", ScrollTrigger.update);

        const tick = (time: number) => {
            // GSAP's ticker is in seconds, Lenis expects milliseconds.
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        // Lenis already smooths the motion; GSAP's own lag smoothing on top of
        // it makes the two fight after a dropped frame.
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(tick);
            gsap.ticker.lagSmoothing(500, 33);
            lenis.destroy();
        };
    }, []);

    return null;
}
