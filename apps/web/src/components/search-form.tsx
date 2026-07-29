import type { InventoryParams } from "@/lib/inventory-params/inventory-params";
import { INVENTORY_PATH } from "@/lib/inventory-params/inventory-params";
import { DEFAULT_DIR, DEFAULT_SORT } from "@/lib/sort/sort";

/**
 * A plain GET form: submitting navigates to `/inventory?search=...`, which
 * the server re-renders. No client JavaScript, and the resulting view is a
 * real URL the user can bookmark or share.
 *
 * Sort and direction ride along as hidden inputs so searching does not
 * silently reset the ordering. `page` is deliberately absent — a new
 * search starts at page 1.
 */
export function SearchForm({ params }: { params: InventoryParams }) {
    return (
        <form method="GET" action={INVENTORY_PATH} className="flex gap-2">
            <label htmlFor="search" className="sr-only">
                Search by SKU or name
            </label>
            <input
                id="search"
                name="search"
                type="search"
                defaultValue={params.search ?? ""}
                placeholder="Search SKU or name"
                className="w-full max-w-xs rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
            />

            {params.sort !== DEFAULT_SORT && (
                <input type="hidden" name="sort" value={params.sort} />
            )}
            {params.dir !== DEFAULT_DIR && (
                <input type="hidden" name="dir" value={params.dir} />
            )}

            <button
                type="submit"
                className="rounded-md border border-black/15 px-4 py-2 font-medium text-sm dark:border-white/20"
            >
                Search
            </button>
        </form>
    );
}
