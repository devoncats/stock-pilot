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
    Paginated,
    StockMovementDto,
} from "@stock-pilot/shared";
import { ListMovementsQueryDto } from "@/modules/inventory/adapter/http/dto/list-movements-query.dto.js";
import { ListPositionsQueryDto } from "@/modules/inventory/adapter/http/dto/list-positions-query.dto.js";
import {
    INVENTORY_QUERY,
    InventoryQuery,
} from "@/modules/inventory/application/ports/inventory-query.js";

@Controller("api/v1/inventory")
export class InventoryController {
    constructor(
        @Inject(INVENTORY_QUERY)
        private readonly inventoryQuery: InventoryQuery,
    ) {}

    @Get()
    listPositions(
        @Query() query: ListPositionsQueryDto,
    ): Promise<Paginated<InventoryPositionDto>> {
        return this.inventoryQuery.listPositions(query);
    }

    @Get(":productId")
    async findPosition(
        @Param("productId") productId: string,
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
        @Param("productId") productId: string,
        @Query() query: ListMovementsQueryDto,
    ): Promise<Paginated<StockMovementDto>> {
        const position = await this.inventoryQuery.findPosition(productId);

        if (!position) {
            throw new NotFoundException(
                `Inventory position not found for product ${productId}`,
            );
        }

        return this.inventoryQuery.listMovements(productId, query);
    }
}
