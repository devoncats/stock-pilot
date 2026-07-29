import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementsPagination } from "@/components/movements-pagination";
import { MovementsTable } from "@/components/movements-table";
import { PositionDetail } from "@/components/position-detail";
import { ApiError } from "@/lib/api/api-error";
import { findPosition, listMovements } from "@/lib/api/inventory";
import { INVENTORY_PATH } from "@/lib/inventory-params/inventory-params";
import {
    DEFAULT_LIMIT,
    parsePage,
    toOffset,
} from "@/lib/pagination/pagination";
import { isProductId } from "@/lib/product-id/product-id";
import type { SearchParamValue } from "@/lib/search-params/search-params";

export const dynamic = "force-dynamic";

export default async function PositionPage({
    params,
    searchParams,
}: {
    params: Promise<{ productId: string }>;
    searchParams: Promise<Record<string, SearchParamValue>>;
}) {
    const { productId } = await params;

    if (!isProductId(productId)) {
        notFound();
    }

    const page = parsePage((await searchParams).page);
    const limit = DEFAULT_LIMIT;

    const [position, movements] = await Promise.all([
        findPosition(productId),
        listMovements(productId, {
            offset: toOffset(page, limit),
            limit,
        }),
    ]).catch((error: unknown) => {
        // The API answers 404 for an unknown id (F1-03). Anything else is a
        // real failure and belongs to error.tsx.
        if (error instanceof ApiError && error.isNotFound) {
            notFound();
        }

        throw error;
    });

    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            <Link
                href={INVENTORY_PATH}
                className="text-sm underline underline-offset-2"
            >
                ← Back to inventory
            </Link>

            <h1 className="mt-4 font-semibold text-2xl">{position.sku}</h1>
            <p className="text-black/60 dark:text-white/60">{position.name}</p>

            <div className="mt-6">
                <PositionDetail position={position} />
            </div>

            <h2 className="mt-8 font-semibold text-lg">Movement history</h2>
            <div className="mt-4">
                <MovementsTable movements={movements.data} />
                <MovementsPagination
                    productId={productId}
                    page={page}
                    limit={limit}
                    total={movements.total}
                />
            </div>
        </main>
    );
}
