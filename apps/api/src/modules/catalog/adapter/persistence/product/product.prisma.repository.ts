import { Injectable } from "@nestjs/common";
import { Page } from "@stock-pilot/shared";
import { ListProductQueryDto } from "@/modules/catalog/adapter/http/dto/list-product-query.dto.js";
import { ProductMapper } from "@/modules/catalog/adapter/persistence/product/product.mapper.js";
import { ProductRepository } from "@/modules/catalog/application/ports/product.repository.js";
import { Product } from "@/modules/catalog/domain/product/product.js";
import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

@Injectable()
export class PrismaProductRepository implements ProductRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: ProductId): Promise<Product | null> {
        const row = await this.prisma.product.findUnique({ where: { id } });

        return row ? ProductMapper.toDomain(row) : null;
    }

    async findBySku(sku: Sku): Promise<Product | null> {
        const row = await this.prisma.product.findUnique({
            where: { sku: sku.value },
        });

        return row ? ProductMapper.toDomain(row) : null;
    }

    async list(params: ListProductQueryDto): Promise<Page<Product>> {
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                take: params.limit,
                skip: params.offset,
                orderBy: { createdAt: "asc" },
            }),

            this.prisma.product.count(),
        ]);

        const products = rows.map(ProductMapper.toDomain);
        const page = Math.floor(params.offset / params.limit) + 1;

        return {
            data: products,
            total,
            page,
            limit: params.limit,
        };
    }

    async save(product: Product): Promise<void> {
        const data = ProductMapper.toPersistence(product);

        await this.prisma.product.upsert({
            where: { id: product.id },
            create: data,
            update: data,
        });
    }
}
