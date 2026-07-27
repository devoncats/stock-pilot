import { Controller, Get, Inject } from "@nestjs/common";
import type { InventoryKpisDto } from "@stock-pilot/shared";
import {
    INVENTORY_QUERY_REPOSITORY,
    type InventoryQuery,
} from "@/modules/inventory/application/ports/inventory-query.repository.js";

@Controller("kpis")
export class KpisController {
    constructor(
        @Inject(INVENTORY_QUERY_REPOSITORY)
        private readonly inventoryQuery: InventoryQuery,
    ) {}

    @Get()
    inventoryKpis(): Promise<InventoryKpisDto> {
        return this.inventoryQuery.inventoryKpis();
    }
}
