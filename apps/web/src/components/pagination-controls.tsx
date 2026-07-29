import Link from "next/link";
import {
    type InventoryParams,
    pageHref,
} from "@/lib/inventory-params/inventory-params";
import {
    hasNextPage,
    hasPreviousPage,
    totalPages,
} from "@/lib/pagination/pagination";

const BUTTON =
    "rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20";
const DISABLED = `${BUTTON} cursor-not-allowed opacity-40`;

/**
 * A link cannot be disabled, so an unavailable direction renders as a
 * `<span aria-disabled>` instead of an anchor — nothing to click, nothing
 * to tab to, and assistive tech is told why.
 */
export function PaginationControls({
    params,
    total,
}: {
    params: InventoryParams;
    total: number;
}) {
    const pages = totalPages(total, params.limit);
    const first = total === 0 ? 0 : (params.page - 1) * params.limit + 1;
    const last = Math.min(params.page * params.limit, total);

    return (
        <nav
            aria-label="Pagination"
            className="mt-4 flex items-center justify-between gap-4"
        >
            <p className="text-black/60 text-sm dark:text-white/60">
                {total === 0
                    ? "No results"
                    : `Showing ${first}–${last} of ${total}`}
            </p>

            <div className="flex items-center gap-2">
                {hasPreviousPage(params.page) ? (
                    <Link
                        href={pageHref(params, params.page - 1)}
                        className={BUTTON}
                        rel="prev"
                    >
                        Previous
                    </Link>
                ) : (
                    <span aria-disabled="true" className={DISABLED}>
                        Previous
                    </span>
                )}

                <span className="text-black/60 text-sm dark:text-white/60">
                    Page {params.page} of {pages}
                </span>

                {hasNextPage(params.page, total, params.limit) ? (
                    <Link
                        href={pageHref(params, params.page + 1)}
                        className={BUTTON}
                        rel="next"
                    >
                        Next
                    </Link>
                ) : (
                    <span aria-disabled="true" className={DISABLED}>
                        Next
                    </span>
                )}
            </div>
        </nav>
    );
}
