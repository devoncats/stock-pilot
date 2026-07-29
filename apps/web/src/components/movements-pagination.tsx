import Link from "next/link";
import { movementsPageHref } from "@/lib/inventory-params/inventory-params";
import {
    hasNextPage,
    hasPreviousPage,
    totalPages,
} from "@/lib/pagination/pagination";

const BUTTON =
    "rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20";
const DISABLED = `${BUTTON} cursor-not-allowed opacity-40`;

export function MovementsPagination({
    productId,
    page,
    limit,
    total,
}: {
    productId: string;
    page: number;
    limit: number;
    total: number;
}) {
    const pages = totalPages(total, limit);

    return (
        <nav
            aria-label="Movements pagination"
            className="mt-4 flex items-center justify-between gap-4"
        >
            <p className="text-black/60 text-sm dark:text-white/60">
                {total === 0
                    ? "No movements"
                    : `${total} movement${total === 1 ? "" : "s"}`}
            </p>

            <div className="flex items-center gap-2">
                {hasPreviousPage(page) ? (
                    <Link
                        href={movementsPageHref(productId, page - 1)}
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
                    Page {page} of {pages}
                </span>

                {hasNextPage(page, total, limit) ? (
                    <Link
                        href={movementsPageHref(productId, page + 1)}
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
