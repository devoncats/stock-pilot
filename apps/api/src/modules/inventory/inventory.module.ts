import { Module } from "@nestjs/common";
import { InventoryController } from "@/modules/inventory/adapter/http/inventory.controller.js";
import { KpisController } from "@/modules/inventory/adapter/http/kpis.controller.js";
import { PrismaInventoryQuery } from "@/modules/inventory/adapter/persistence/inventory-query.prisma.repository.js";
import { INVENTORY_QUERY_REPOSITORY } from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";

@Module({
    controllers: [InventoryController, KpisController],
    providers: [
        {
            provide: INVENTORY_QUERY_REPOSITORY,
            useClass: PrismaInventoryQuery,
        },
    ],
})
export class InventoryModule {}
