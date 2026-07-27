import { Controller, Get, Inject } from "@nestjs/common";
import type { InventoryKpisDto } from "@stock-pilot/shared";
import {
    INVENTORY_QUERY,
    InventoryQuery,
} from "@/modules/inventory/application/ports/inventory-query.repository.js";

@Controller("api/v1/kpis")
export class KpisController {
    constructor(
        @Inject(INVENTORY_QUERY)
        private readonly inventoryQuery: InventoryQuery,
    ) {}

    @Get()
    inventoryKpis(): Promise<InventoryKpisDto> {
        return this.inventoryQuery.inventoryKpis();
    }
}
