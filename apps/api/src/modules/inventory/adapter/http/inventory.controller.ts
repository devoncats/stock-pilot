import {
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    Query,
} from "@nestjs/common";
import type {
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import { ListMovementsQueryDto } from "@/modules/inventory/adapter/http/dto/list-movements-query.dto.js";
import { ListPositionsQueryDto } from "@/modules/inventory/adapter/http/dto/list-positions-query.dto.js";
import {
    INVENTORY_QUERY_REPOSITORY,
    type InventoryQuery,
} from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";

@Controller("inventory")
export class InventoryController {
    constructor(
        @Inject(INVENTORY_QUERY_REPOSITORY)
        private readonly inventoryQuery: InventoryQuery,
    ) {}

    @Get()
    async listPositions(
        @Query() query: ListPositionsQueryDto,
    ): Promise<Page<InventoryPositionDto>> {
        return this.inventoryQuery.listPositions(query);
    }

    @Get(":productId")
    async findPosition(
        @Param("productId") productId: ProductId,
    ): Promise<InventoryPositionDto> {
        const position = await this.inventoryQuery.findPosition(productId);

        if (!position) {
            throw new NotFoundException(
                `Inventory position not found for product ${productId}`,
            );
        }

        return position;
    }

    @Get(":productId/movements")
    async listMovements(
        @Param("productId") productId: ProductId,
        @Query() query: ListMovementsQueryDto,
    ): Promise<Page<StockMovementDto>> {
        const position = await this.inventoryQuery.findPosition(productId);

        if (!position) {
            throw new NotFoundException(
                `Inventory position not found for product ${productId}`,
            );
        }

        return this.inventoryQuery.listMovements(productId, query);
    }
}
