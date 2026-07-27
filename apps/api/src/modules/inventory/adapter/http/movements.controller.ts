import { Body, Controller, Post } from "@nestjs/common";
import { MovementType, ReferenceType } from "@stock-pilot/shared";
import { RecordMovementDto } from "@/modules/inventory/adapter/http/dto/record-movement.dto.js";
import {
    RecordStockMovement,
    type RecordStockMovementResult,
} from "@/modules/inventory/application/commands/record-stock-movement.use-case.js";

@Controller("inventory/movements")
export class MovementsController {
    constructor(private readonly recordStockMovement: RecordStockMovement) {}

    @Post()
    async recordMovement(
        @Body() body: RecordMovementDto,
    ): Promise<RecordStockMovementResult & { productId: string }> {
        const result = await this.recordStockMovement.execute({
            productId: body.productId,
            type: MovementType.ADJUSTMENT,
            qty: body.qty,
            reference: { type: ReferenceType.MANUAL },
            reason: body.reason,
        });

        return { ...result, productId: body.productId };
    }
}
