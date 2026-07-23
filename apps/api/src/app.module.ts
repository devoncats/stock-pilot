import { Module } from "@nestjs/common";
import { HealthModule } from "@/health/health.module.js";
import { CatalogModule } from "@/modules/catalog/catalog.module.js";
import { PrismaModule } from "@/shared/prisma/prisma.module.js";

@Module({
    imports: [HealthModule, PrismaModule, CatalogModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
