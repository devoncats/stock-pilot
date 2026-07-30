import type { InventoryKpisDto } from "@stock-pilot/shared";
import { formatCoverage } from "@/lib/format/format-coverage";
import { formatMoneyCents } from "@/lib/format/format-money-cents";
import { formatQuantity } from "@/lib/format/format-quantity";

export function KpiCards({ kpis }: { kpis: InventoryKpisDto }) {
    const cards = [
        { label: "SKUs", value: formatQuantity(kpis.totalSkus) },
        {
            label: "Inventory value",
            value: formatMoneyCents(kpis.inventoryValueCents),
        },
        {
            label: "Average coverage",
            value: formatCoverage(kpis.averageCoverageWeeks),
        },
        { label: "Out of stock", value: formatQuantity(kpis.skusOutOfStock) },
    ];

    return (
        <section aria-labelledby="kpis-heading">
            <h2 id="kpis-heading" className="sr-only">
                Inventory KPIs
            </h2>

            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-lg border border-black/10 p-4 dark:border-white/15"
                    >
                        <dt className="text-sm text-black/60 dark:text-white/60">
                            {card.label}
                        </dt>
                        <dd className="mt-1 font-semibold text-2xl tabular-nums">
                            {card.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <p className="mt-2 text-black/50 text-xs dark:text-white/50">
                {kpis.demandHistoryThroughWeek
                    ? `Coverage is measured against demand through the week of ${kpis.demandHistoryThroughWeek}.`
                    : "No demand history loaded, so coverage cannot be computed."}
            </p>
        </section>
    );
}
