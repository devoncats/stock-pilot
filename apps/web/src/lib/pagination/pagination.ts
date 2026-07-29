import {
    firstValue,
    type SearchParamValue,
} from "@/lib/search-params/search-params";

export const DEFAULT_LIMIT = 25;

/** Mirrors `@Max(100)` on the API's query DTOs (F1-03). */
export const MAX_LIMIT = 100;

/**
 * A hand-editable URL is untrusted input. Anything that is not a positive
 * integer resolves to `null` here so the caller can fall back, rather than
 * reaching the API as `NaN` and being rejected by `@IsInt()` — a typo in
 * the address bar should not 400 the dashboard.
 */
function parsePositiveInteger(raw: SearchParamValue): number | null {
    const value = firstValue(raw);

    if (value === undefined || value.trim() === "") {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
}

export function parsePage(raw: SearchParamValue): number {
    return parsePositiveInteger(raw) ?? 1;
}

export function parseLimit(raw: SearchParamValue): number {
    const parsed = parsePositiveInteger(raw);

    if (parsed === null) {
        return DEFAULT_LIMIT;
    }

    return Math.min(parsed, MAX_LIMIT);
}

/** The browser counts pages from 1; the API counts rows from 0. */
export function toOffset(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * An empty result set is still one page — the one showing the empty state.
 * Returning 0 would make page 1 "past the end" and force every caller to
 * special-case it.
 */
export function totalPages(total: number, limit: number): number {
    return Math.max(1, Math.ceil(total / limit));
}

export function hasPreviousPage(page: number): boolean {
    return page > 1;
}

export function hasNextPage(
    page: number,
    total: number,
    limit: number,
): boolean {
    return page < totalPages(total, limit);
}
