import { firstValue } from "@/lib/search-params/search-params";

/**
 * Mirrors `SORT_VALUES` / `DIR_VALUES` on the API's query port (F1-03).
 * The API validates these with `@IsIn(...)`, so an unrecognised value is a
 * 400 for the whole page rather than a param it quietly ignores — a
 * hand-edited URL must fall back here instead of being forwarded.
 */
export const SORT_VALUES = ["sku", "onHand", "value"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const DIR_VALUES = ["asc", "desc"] as const;
export type DirValue = (typeof DIR_VALUES)[number];

export const DEFAULT_SORT: SortValue = "sku";
export const DEFAULT_DIR: DirValue = "asc";

export function parseSort(raw: string | string[] | undefined): SortValue {
    const value = firstValue(raw);

    return SORT_VALUES.find((sort) => sort === value) ?? DEFAULT_SORT;
}

export function parseDir(raw: string | string[] | undefined): DirValue {
    const value = firstValue(raw);

    return DIR_VALUES.find((dir) => dir === value) ?? DEFAULT_DIR;
}
