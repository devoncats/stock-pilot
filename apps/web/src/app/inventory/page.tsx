import { KpiCards } from "@/components/kpi-cards";
import { PaginationControls } from "@/components/pagination-controls";
import { PositionsTable } from "@/components/positions-table";
import { SearchForm } from "@/components/search-form";
import { fetchKpis, listPositions } from "@/lib/api/inventory";
import {
    parseInventoryParams,
    type RawSearchParams,
} from "@/lib/inventory-params/inventory-params";
import { toOffset } from "@/lib/pagination/pagination";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const params = parseInventoryParams(await searchParams);

    const [kpis, positions] = await Promise.all([
        fetchKpis(),
        listPositions({
            search: params.search,
            offset: toOffset(params.page, params.limit),
            limit: params.limit,
            sort: params.sort,
            dir: params.dir,
        }),
    ]);

    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            <h1 className="font-semibold text-2xl">Inventory</h1>

            <div className="mt-6">
                <KpiCards kpis={kpis} />
            </div>

            <div className="mt-8">
                <SearchForm params={params} />
            </div>

            <div className="mt-4">
                <PositionsTable positions={positions.data} params={params} />
                <PaginationControls params={params} total={positions.total} />
            </div>
        </main>
    );
}
