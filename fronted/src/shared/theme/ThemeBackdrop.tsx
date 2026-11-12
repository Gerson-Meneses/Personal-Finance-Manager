import type { CSSProperties } from "react";
import "./ThemeBackdrop.css";

const SNOWFLAKES = Array.from({ length: 22 }, (_, index) => ({
    left: (index * 37) % 100,
    delay: (index * 1.7) % 16,
    duration: 13 + (index % 7) * 1.8,
    size: 2 + (index % 4),
    drift: (index % 2 === 0 ? 1 : -1) * (8 + (index % 5) * 7),
    opacity: 0.16 + (index % 4) * 0.07,
}));

export function ThemeBackdrop() {
    return (
        <div className="theme-backdrop" aria-hidden="true">
            <div className="theme-backdrop__stars" />
            <div className="theme-backdrop__snow">
                {SNOWFLAKES.map((flake, index) => (
                    <span
                        key={index}
                        className="theme-backdrop__flake"
                        style={{
                            left: `${flake.left}%`,
                            width: `${flake.size}px`,
                            height: `${flake.size}px`,
                            opacity: flake.opacity,
                            animationDelay: `${flake.delay}s`,
                            animationDuration: `${flake.duration}s`,
                            "--drift": `${flake.drift}px`,
                        } as CSSProperties}
                    />
                ))}
            </div>
        </div>
    );
}
