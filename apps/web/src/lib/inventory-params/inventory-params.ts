import { toQueryString } from "@/lib/api/query-string";
import {
    DEFAULT_LIMIT,
    parseLimit,
    parsePage,
} from "@/lib/pagination/pagination";
import {
    firstValue,
    type SearchParamValue,
} from "@/lib/search-params/search-params";
import {
    DEFAULT_DIR,
    DEFAULT_SORT,
    type DirValue,
    parseDir,
    parseSort,
    type SortValue,
} from "@/lib/sort/sort";

export const INVENTORY_PATH = "/inventory";

export interface InventoryParams {
    search: string | undefined;
    page: number;
    limit: number;
    sort: SortValue;
    dir: DirValue;
}

/**
 * Every view on this page is a URL, so links are built by patching the
 * current params rather than assembling them from scratch — changing the
 * sort must not silently drop the search term.
 *
 * Params already at their default are omitted, keeping shared links short
 * and making `/inventory` and `/inventory?page=1&sort=sku` the same view.
 */
export function buildInventoryHref(
    current: InventoryParams,
    patch: Partial<InventoryParams> = {},
): string {
    const next = { ...current, ...patch };

    return `${INVENTORY_PATH}${toQueryString({
        search: next.search,
        sort: next.sort === DEFAULT_SORT ? undefined : next.sort,
        dir: next.dir === DEFAULT_DIR ? undefined : next.dir,
        page: next.page === 1 ? undefined : next.page,
        limit: next.limit === DEFAULT_LIMIT ? undefined : next.limit,
    })}`;
}

/**
 * Clicking the active column flips direction; clicking any other column
 * starts ascending. Either way the page resets — row 51 under the old
 * order is not row 51 under the new one.
 */
export function sortHref(current: InventoryParams, column: SortValue): string {
    const isActive = current.sort === column;
    const dir: DirValue = isActive && current.dir === "asc" ? "desc" : "asc";

    return buildInventoryHref(current, { sort: column, dir, page: 1 });
}

export function pageHref(current: InventoryParams, page: number): string {
    return buildInventoryHref(current, { page });
}

export type RawSearchParams = Record<string, SearchParamValue>;

/**
 * The inverse of `buildInventoryHref`. The URL is user-editable, so every
 * field falls back to a default rather than forwarding junk to an API that
 * validates with `@IsIn` and `@IsInt` — a typo should not 400 the page.
 */
export function parseInventoryParams(raw: RawSearchParams): InventoryParams {
    const search = firstValue(raw.search)?.trim();

    return {
        search: search === "" ? undefined : search,
        page: parsePage(raw.page),
        limit: parseLimit(raw.limit),
        sort: parseSort(raw.sort),
        dir: parseDir(raw.dir),
    };
}

/**
 * The product id lands in the path, not the query, so `toQueryString` never
 * sees it and nothing else would escape it.
 */
export function positionHref(productId: string): string {
    return `${INVENTORY_PATH}/${encodeURIComponent(productId)}`;
}

export function movementsPageHref(productId: string, page: number): string {
    return `${positionHref(productId)}${toQueryString({
        page: page === 1 ? undefined : page,
    })}`;
}
