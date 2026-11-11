import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

const WINDOW_MS = Number(process.env.AUTH_RATE_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.AUTH_RATE_MAX ?? 30);

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(c: Parameters<MiddlewareHandler<AppEnv>>[0]) {
    return (
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        "unknown"
    );
}

export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
    );
};

export const authRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
    const key = clientIp(c);
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }

    current.count += 1;
    if (current.count > MAX_REQUESTS) {
        const retryAfter = Math.ceil((current.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        return c.json(
            {
                error: {
                    type: "RATE_LIMITED",
                    message: "Demasiados intentos. Espera un momento antes de volver a intentarlo.",
                },
            },
            429
        );
    }

    return next();
};

export function resetRateLimitStore() {
    buckets.clear();
}
