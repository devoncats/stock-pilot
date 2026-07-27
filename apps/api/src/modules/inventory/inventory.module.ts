import { Module } from "@nestjs/common";
import { InventoryController } from "@/modules/inventory/adapter/http/inventory.controller.js";
import { KpisController } from "@/modules/inventory/adapter/http/kpis.controller.js";
import { MovementsController } from "@/modules/inventory/adapter/http/movements.controller.js";
import { PrismaInventoryItemRepository } from "@/modules/inventory/adapter/persistence/inventory-item/inventory-item.prisma.repository.js";
import { PrismaInventoryQuery } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-query.prisma.repository.js";
import { PrismaStockMovementRepository } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement.prisma.repository.js";
import { INVENTORY_ITEM_REPOSITORY } from "@/modules/inventory/application/commands/ports/inventory-item.repository.js";
import { STOCK_MOVEMENT_REPOSITORY } from "@/modules/inventory/application/commands/ports/stock-movement.repository.js";
import { RecordStockMovement } from "@/modules/inventory/application/commands/record-stock-movement.use-case.js";
import { INVENTORY_QUERY_REPOSITORY } from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";

@Module({
    controllers: [InventoryController, KpisController, MovementsController],
    providers: [
        RecordStockMovement,
        {
            provide: INVENTORY_QUERY_REPOSITORY,
            useClass: PrismaInventoryQuery,
        },
        {
            provide: INVENTORY_ITEM_REPOSITORY,
            useClass: PrismaInventoryItemRepository,
        },
        {
            provide: STOCK_MOVEMENT_REPOSITORY,
            useClass: PrismaStockMovementRepository,
        },
    ],
})
export class InventoryModule {}
