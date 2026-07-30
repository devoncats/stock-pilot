import type { StockMovementDto } from "@stock-pilot/shared";
import { formatQuantity } from "@/lib/format/format-quantity";

const HEAD = "px-3 py-2 text-left font-medium";
const HEAD_NUM = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2";
const CELL_NUM = "px-3 py-2 text-right tabular-nums";

/**
 * `signedQty` is signed at the source: receipts are positive, shipments
 * negative. It is rendered as sent rather than recomputed from `type`, so
 * the ledger on screen matches the ledger in the database.
 */
export function MovementsTable({
    movements,
}: {
    movements: StockMovementDto[];
}) {
    if (movements.length === 0) {
        return (
            <p className="rounded-lg border border-black/10 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
                No stock movements recorded for this SKU.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                    Stock movements, newest first
                </caption>
                <thead className="border-black/10 border-b dark:border-white/15">
                    <tr>
                        <th scope="col" className={HEAD}>
                            Week
                        </th>
                        <th scope="col" className={HEAD}>
                            Type
                        </th>
                        <th scope="col" className={HEAD_NUM}>
                            Quantity
                        </th>
                        <th scope="col" className={HEAD}>
                            Reference
                        </th>
                        <th scope="col" className={HEAD}>
                            Reason
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {movements.map((movement) => (
                        <tr
                            key={movement.id}
                            className="border-black/5 border-b dark:border-white/10"
                        >
                            <td className={CELL}>
                                <time dateTime={movement.week}>
                                    {movement.week}
                                </time>
                            </td>
                            <td className={CELL}>{movement.type}</td>
                            <td className={CELL_NUM}>
                                {movement.signedQty > 0 ? "+" : ""}
                                {formatQuantity(movement.signedQty)}
                            </td>
                            <td className={CELL}>{movement.referenceType}</td>
                            <td className={CELL}>{movement.reason ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
