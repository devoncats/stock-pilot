import { Module } from "@nestjs/common";
import { HealthModule } from "@/health/health.module.js";
import { CatalogModule } from "@/modules/catalog/catalog.module.js";
import { InventoryModule } from "@/modules/inventory/inventory.module.js";
import { PrismaModule } from "@/shared/prisma/prisma.module.js";

@Module({
    imports: [HealthModule, PrismaModule, CatalogModule, InventoryModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
