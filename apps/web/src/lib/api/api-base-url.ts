export interface ApiUrlEnv {
    API_URL?: string | undefined;
    NEXT_PUBLIC_API_URL?: string | undefined;
}

/**
 * Server Components fetch from the Next server, not the browser, so the
 * two need different hosts under Compose: `localhost` inside the `web`
 * container is the container itself, not the API (trap verified in F0-02).
 *
 * `API_URL` is the server-only variable and wins. `NEXT_PUBLIC_API_URL` is
 * the browser's, and works as a fallback on the host where both resolve to
 * the same place.
 */
export function resolveApiBaseUrl(env: ApiUrlEnv): string {
    const base = env.API_URL || env.NEXT_PUBLIC_API_URL;

    if (!base) {
        throw new Error(
            "[api]: API_URL is not set. Copy .env.example to .env at the repo root.",
        );
    }

    return base.replace(/\/+$/, "");
}
