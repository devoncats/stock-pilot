import type { StockMovementDto } from "@stock-pilot/shared";
import type { StockMovementModel } from "@/generated/prisma/models.js";

export const StockMovementMapper = {
    toDto(row: StockMovementModel): StockMovementDto {
        return {
            id: row.id,
            type: row.type,
            signedQty: row.signedQty,
            week: row.week.toISOString().slice(0, 10),
            referenceType: row.referenceType,
            referenceId: row.referenceId,
            reason: row.reason,
            createdAt: row.createdAt.toISOString(),
        };
    },
};
