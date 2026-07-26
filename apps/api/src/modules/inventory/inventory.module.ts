import { Module } from "@nestjs/common";
import { InventoryController } from "@/modules/inventory/adapter/http/inventory.controller.js";
import { KpisController } from "@/modules/inventory/adapter/http/kpis.controller.js";
import { PrismaInventoryQuery } from "@/modules/inventory/adapter/persistence/inventory-query.prisma.adapter.js";
import { INVENTORY_QUERY } from "@/modules/inventory/application/ports/inventory-query.js";

@Module({
    controllers: [InventoryController, KpisController],
    providers: [
        {
            provide: INVENTORY_QUERY,
            useClass: PrismaInventoryQuery,
        },
    ],
})
export class InventoryModule {}
