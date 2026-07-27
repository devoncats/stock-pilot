import type { InventoryPositionDto } from "@stock-pilot/shared";
import { Prisma } from "@/generated/prisma/client.js";
import { calculateCoverageWeeks } from "@/modules/inventory/domain/coverage-weeks/calculate-coverage-weeks.js";
import { derivePosition } from "@/modules/inventory/domain/derive-position/derive-position.js";
import { calculateInventoryValue } from "@/modules/inventory/domain/value/calculate-inventory-value.js";
import { Money } from "@/shared/domain/money/money.js";

export type InventoryItemWithProduct = Prisma.InventoryItemGetPayload<{
    include: { product: true };
}>;

export const InventoryPositionMapper = {
    toDto(
        row: InventoryItemWithProduct,
        averageWeeklyDemand: number | null,
    ): InventoryPositionDto {
        const { available, position } = derivePosition(row);
        const unitCostCents = Money.fromDecimalString(
            row.product.unitCost.toString(),
        ).cents;

        return {
            productId: row.productId,
            sku: row.product.sku,
            name: row.product.name,
            onHand: row.onHand,
            reserved: row.reserved,
            available,
            onOrder: row.onOrder,
            backordered: row.backordered,
            position,
            unitCostCents,
            valueCents: calculateInventoryValue([
                { onHand: row.onHand, unitCostCents },
            ]),
            coverageWeeks: calculateCoverageWeeks({
                position,
                averageWeeklyDemand,
            }),
        };
    },
};
