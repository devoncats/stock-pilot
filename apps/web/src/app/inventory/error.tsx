"use client";

/**
 * Must be a Client Component: Next needs an error boundary, and boundaries
 * are a client-side React feature. Covers this segment and everything
 * below it, so the detail route shares it.
 */
export default function InventoryError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            <h1 className="font-semibold text-2xl">Inventory is unavailable</h1>

            <p className="mt-2 text-black/70 dark:text-white/70">
                The dashboard could not reach the inventory API. The data is
                safe — this page just could not read it.
            </p>

            {error.digest && (
                <p className="mt-2 text-black/50 text-sm dark:text-white/50">
                    Reference: {error.digest}
                </p>
            )}

            <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-md border border-black/15 px-4 py-2 font-medium text-sm dark:border-white/20"
            >
                Try again
            </button>
        </main>
    );
}
