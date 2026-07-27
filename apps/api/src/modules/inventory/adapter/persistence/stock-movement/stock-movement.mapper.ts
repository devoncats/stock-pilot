import { Prisma } from "@/generated/prisma/client.js";
import type { StockMovementModel } from "@/generated/prisma/models.js";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { stockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";
export const StockMovementMapper = {
    toPersistence(
        stockMovement: StockMovement,
    ): Prisma.StockMovementUncheckedCreateInput {
        return {
            id: stockMovement.id,
            productId: stockMovement.productId,
            type: stockMovement.type,
            signedQty: stockMovement.qty,
            week: stockMovement.week.toString(),
            referenceType: stockMovement.reference.type,
            referenceId: stockMovement.reference.id,
            reason: stockMovement.reason,
            createdAt: stockMovement.occurredAt,
        };
    },
    toDomain(row: StockMovementModel): StockMovement {
        return StockMovement.create({
            id: stockMovementId(row.id),
            productId: productId(row.productId),
            type: row.type,
            qty: row.signedQty,
            reference: MovementReference.create(
                row.referenceType,
                row.referenceId,
            ),
            reason: row.reason,
            occurredAt: row.createdAt,
        });
    },
};
