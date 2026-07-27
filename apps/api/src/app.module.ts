import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { HealthModule } from "@/health/health.module.js";
import { CatalogModule } from "@/modules/catalog/catalog.module.js";
import { InventoryModule } from "@/modules/inventory/inventory.module.js";
import { DomainErrorFilter } from "@/shared/http/domain-error.filter.js";
import { PrismaModule } from "@/shared/prisma/prisma.module.js";
import { SharedModule } from "@/shared/shared.module.js";

@Module({
    imports: [
        SharedModule,
        HealthModule,
        PrismaModule,
        CatalogModule,
        InventoryModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({ transform: true, whitelist: true }),
        },
        {
            provide: APP_FILTER,
            useClass: DomainErrorFilter,
        },
    ],
})
export class AppModule {}
