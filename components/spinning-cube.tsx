"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/**
 * The hero mark: a real 3D cube, rotating continuously.
 *
 * The geometry lives in `globals.css`; GSAP drives the rotation, which is what
 * makes it a smooth continuous spin rather than a CSS keyframe loop that resets
 * on every cycle.
 *
 * `rotationY` is animated in isolation while the X tilt stays put — a cube
 * tumbling on two axes at once loses its horizon and reads as noise. Holding
 * the tilt keeps three faces lit and the object legible as a cube throughout.
 */
export function SpinningCube() {
    const scope = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            // Reduced motion slows the cube rather than stopping it. A single
            // small decorative object turning slowly is a long way from the
            // parallax and auto-playing motion that setting exists to suppress,
            // and a motionless cube is what made this read as a flat square in
            // the first place. The tilt drift is dropped there — one steady axis
            // is calm, two is a tumble.
            gsap.to(".cube", {
                rotationY: "+=360",
                duration: calm ? 20 : 8,
                ease: "none",
                repeat: -1,
                // Without this GSAP resolves the rotation against the element's
                // own axes; the cube has to turn about the scene's vertical or
                // the tilt wobbles as it goes round.
                transformOrigin: "50% 50%",
            });

            if (calm) return;

            // A slow independent drift on the tilt. Its period is deliberately
            // not a factor of the spin's, so the two never resynchronise into a
            // visible loop.
            gsap.to(".cube", {
                rotationX: "-=8",
                duration: 3.4,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });
        },
        { scope },
    );

    return (
        <div className="cube-scene" ref={scope} aria-hidden>
            <div className="cube">
                <div className="cube-face f-front" />
                <div className="cube-face f-back" />
                <div className="cube-face f-right" />
                <div className="cube-face f-left" />
                <div className="cube-face f-top" />
                <div className="cube-face f-bottom" />
            </div>
        </div>
    );
}
