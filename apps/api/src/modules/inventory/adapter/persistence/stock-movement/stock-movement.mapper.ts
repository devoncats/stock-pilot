import { Prisma } from "@/generated/prisma/client.js";
import { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";

export const StockMovementMapper = {
    toPersistence(
        stockMovement: StockMovement,
    ): Prisma.StockMovementUncheckedCreateInput {
        return {
            id: stockMovement.id,
            productId: stockMovement.productId,
            type: stockMovement.type,
            signedQty: stockMovement.qty,
            week: stockMovement.week.value,
            referenceType: stockMovement.reference.type,
            referenceId: stockMovement.reference.id,
            reason: stockMovement.reason,
            createdAt: stockMovement.occurredAt,
        };
    },
};
