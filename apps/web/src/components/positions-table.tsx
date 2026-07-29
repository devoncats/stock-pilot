import type { InventoryPositionDto } from "@stock-pilot/shared";
import Link from "next/link";
import { formatCoverage } from "@/lib/format/format-coverage";
import { formatMoneyCents } from "@/lib/format/format-money-cents";
import { formatQuantity } from "@/lib/format/format-quantity";
import {
    type InventoryParams,
    positionHref,
    sortHref,
} from "@/lib/inventory-params/inventory-params";
import type { SortValue } from "@/lib/sort/sort";

const HEAD = "px-3 py-2 text-left font-medium";
const HEAD_NUM = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2";
const CELL_NUM = "px-3 py-2 text-right tabular-nums";

/**
 * `aria-sort` belongs on the header cell, not the link: it tells assistive
 * tech which column the table is currently ordered by, and in which
 * direction. Only the active column may carry anything but "none".
 */
function ariaSort(
    params: InventoryParams,
    column: SortValue,
): "ascending" | "descending" | "none" {
    if (params.sort !== column) {
        return "none";
    }

    return params.dir === "asc" ? "ascending" : "descending";
}

function SortableHeader({
    params,
    column,
    label,
    align = "left",
}: {
    params: InventoryParams;
    column: SortValue;
    label: string;
    align?: "left" | "right";
}) {
    const active = params.sort === column;
    const indicator = active ? (params.dir === "asc" ? "▲" : "▼") : "";

    return (
        <th
            scope="col"
            aria-sort={ariaSort(params, column)}
            className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
        >
            <Link
                href={sortHref(params, column)}
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
                {label}
                <span aria-hidden="true" className="text-xs">
                    {indicator}
                </span>
            </Link>
        </th>
    );
}

export function PositionsTable({
    positions,
    params,
}: {
    positions: InventoryPositionDto[];
    params: InventoryParams;
}) {
    if (positions.length === 0) {
        return (
            <p className="rounded-lg border border-black/10 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
                No SKUs match this search.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                    Inventory positions by SKU
                </caption>
                <thead className="border-black/10 border-b dark:border-white/15">
                    <tr>
                        <SortableHeader
                            params={params}
                            column="sku"
                            label="SKU"
                        />
                        <th scope="col" className={HEAD}>
                            Name
                        </th>
                        <SortableHeader
                            params={params}
                            column="onHand"
                            label="On hand"
                            align="right"
                        />
                        <th scope="col" className={HEAD_NUM}>
                            Available
                        </th>
                        <th scope="col" className={HEAD_NUM}>
                            Position
                        </th>
                        <SortableHeader
                            params={params}
                            column="value"
                            label="Value"
                            align="right"
                        />
                        <th scope="col" className={HEAD_NUM}>
                            Coverage
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map((position) => (
                        <tr
                            key={position.productId}
                            className="border-black/5 border-b dark:border-white/10"
                        >
                            <td className={CELL}>
                                <Link
                                    href={positionHref(position.productId)}
                                    className="underline underline-offset-2"
                                >
                                    {position.sku}
                                </Link>
                            </td>
                            <td className={CELL}>{position.name}</td>
                            <td className={CELL_NUM}>
                                {formatQuantity(position.onHand)}
                            </td>
                            <td className={CELL_NUM}>
                                {formatQuantity(position.available)}
                            </td>
                            <td className={CELL_NUM}>
                                {formatQuantity(position.position)}
                            </td>
                            <td className={CELL_NUM}>
                                {formatMoneyCents(position.valueCents)}
                            </td>
                            <td className={CELL_NUM}>
                                {formatCoverage(position.coverageWeeks)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
