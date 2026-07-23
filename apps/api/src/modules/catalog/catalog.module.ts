import { Module } from "@nestjs/common";
import { PrismaProductRepository } from "@/modules/catalog/adapter/persistence/product/product.prisma.repository.js";
import { PRODUCT_REPOSITORY } from "@/modules/catalog/application/ports/product.repository.js";

@Module({
    providers: [
        {
            provide: PRODUCT_REPOSITORY,
            useClass: PrismaProductRepository,
        },
    ],
    exports: [PRODUCT_REPOSITORY],
})
export class CatalogModule {}
