import type { CSSProperties } from "react";
import { CandyCane, Gift, Snowflake, TreePine } from "lucide-react";
import "./ThemeBackdrop.css";

type OrnamentKind = "candy" | "mistletoe" | "gift" | "tree" | "snowflake";

const ORNAMENT_KINDS: OrnamentKind[] = ["candy", "mistletoe", "gift", "tree", "snowflake"];

const ORNAMENT_COLORS: Record<OrnamentKind, string> = {
    candy: "#C8323C",
    mistletoe: "#2F8F5B",
    gift: "#E6B94D",
    tree: "#2F8F5B",
    snowflake: "#E2E8F0",
};

function seeded(seed: number) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
}

const STARS = Array.from({ length: 55 }, (_, index) => ({
    left: seeded(index + 1) * 100,
    top: seeded(index + 101) * 100,
    size: 2 + seeded(index + 201) * 3.5,
    rotation: seeded(index + 301) * 360,
    opacity: 0.16 + seeded(index + 401) * 0.26,
    delay: seeded(index + 501) * 8,
}));

const ORNAMENTS = Array.from({ length: 18 }, (_, index) => {
    const kind = ORNAMENT_KINDS[index % ORNAMENT_KINDS.length];
    return {
        kind,
        left: 3 + seeded(index + 601) * 94,
        top: 4 + seeded(index + 701) * 92,
        size: 14 + seeded(index + 801) * 15,
        rotation: -30 + seeded(index + 901) * 60,
        opacity: 0.10 + seeded(index + 1001) * 0.10,
    };
});

const SNOWFLAKES = Array.from({ length: 28 }, (_, index) => ({
    left: (index * 37) % 100,
    delay: (index * 1.7) % 16,
    duration: 13 + (index % 7) * 1.8,
    size: 2 + (index % 4),
    drift: (index % 2 === 0 ? 1 : -1) * (8 + (index % 5) * 7),
    opacity: 0.16 + (index % 4) * 0.07,
}));

function Mistletoe({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 3c-.7 2-.4 4 1 5.5" />
            <path d="M12.8 8.4C10.5 6.6 7.7 6.3 5.6 7.4c.2 2.5 2 4.6 4.5 5.1 1.3.3 2.5.1 3.5-.5" />
            <path d="M12.8 8.4c2.3-1.8 5.1-2.1 7.2-1-.2 2.5-2 4.6-4.5 5.1-1.3.3-2.5.1-3.5-.5" />
            <path d="M12.8 8.4c-.4 2.2 0 4.2 1.1 5.8" />
            <circle cx="12.8" cy="15" r=".8" fill="#E6B94D" stroke="none" />
            <circle cx="10.5" cy="13.6" r=".7" fill="#E6B94D" stroke="none" />
            <circle cx="15.1" cy="13.6" r=".7" fill="#E6B94D" stroke="none" />
        </svg>
    );
}

function OrnamentIcon({ kind, size }: { kind: OrnamentKind; size: number }) {
    switch (kind) {
        case "candy":
            return <CandyCane size={size} strokeWidth={1.3} aria-hidden="true" />;
        case "gift":
            return <Gift size={size} strokeWidth={1.3} aria-hidden="true" />;
        case "tree":
            return <TreePine size={size} strokeWidth={1.3} aria-hidden="true" />;
        case "snowflake":
            return <Snowflake size={size} strokeWidth={1.2} aria-hidden="true" />;
        case "mistletoe":
            return <Mistletoe size={size} />;
    }
}

export function ThemeBackdrop() {
    return (
        <div className="theme-backdrop" aria-hidden="true">
            <div className="theme-backdrop__stars">
                {STARS.map((star, index) => (
                    <span
                        key={`star-${index}`}
                        className="theme-backdrop__star"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            transform: `rotate(${star.rotation}deg)`,
                            animationDelay: `${star.delay}s`,
                        }}
                    >
                        <svg viewBox="0 0 100 100">
                            <path
                                d="M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                ))}
            </div>

            <div className="theme-backdrop__ornaments">
                {ORNAMENTS.map((ornament, index) => (
                    <span
                        key={`ornament-${index}`}
                        className="theme-backdrop__ornament"
                        style={{
                            left: `${ornament.left}%`,
                            top: `${ornament.top}%`,
                            color: ORNAMENT_COLORS[ornament.kind],
                            opacity: ornament.opacity,
                            transform: `rotate(${ornament.rotation}deg)`,
                        }}
                    >
                        <OrnamentIcon kind={ornament.kind} size={ornament.size} />
                    </span>
                ))}
            </div>

            <div className="theme-backdrop__snow">
                {SNOWFLAKES.map((flake, index) => (
                    <span
                        key={`flake-${index}`}
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
