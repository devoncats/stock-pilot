import type { InventoryPositionDto } from "@stock-pilot/shared";
import { formatCoverage } from "@/lib/format/format-coverage";
import { formatMoneyCents } from "@/lib/format/format-money-cents";
import { formatQuantity } from "@/lib/format/format-quantity";

export function PositionDetail({
    position,
}: {
    position: InventoryPositionDto;
}) {
    const fields = [
        { label: "On hand", value: formatQuantity(position.onHand) },
        { label: "Reserved", value: formatQuantity(position.reserved) },
        { label: "Available", value: formatQuantity(position.available) },
        { label: "On order", value: formatQuantity(position.onOrder) },
        { label: "Backordered", value: formatQuantity(position.backordered) },
        { label: "Position", value: formatQuantity(position.position) },
        { label: "Unit cost", value: formatMoneyCents(position.unitCostCents) },
        { label: "Value", value: formatMoneyCents(position.valueCents) },
        { label: "Coverage", value: formatCoverage(position.coverageWeeks) },
    ];

    return (
        <section aria-labelledby="position-heading">
            <h2 id="position-heading" className="sr-only">
                Current position
            </h2>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className="rounded-lg border border-black/10 p-4 dark:border-white/15"
                    >
                        <dt className="text-black/60 text-sm dark:text-white/60">
                            {field.label}
                        </dt>
                        <dd className="mt-1 font-semibold text-lg tabular-nums">
                            {field.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
