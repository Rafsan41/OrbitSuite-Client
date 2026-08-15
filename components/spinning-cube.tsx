/**
 * The hero mark. Entirely CSS (see `globals.css`), so it stays a server
 * component and ships no JavaScript. Faces use the brand palette directly:
 * terracotta, teal, and the two tints.
 */
export function SpinningCube() {
    return (
        <div className="cube-scene" aria-hidden>
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
