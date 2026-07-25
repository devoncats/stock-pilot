import { randomUUID } from "node:crypto";
import type { PrismaService } from "@/shared/prisma/prisma.service.js";

export async function createProduct(
    prisma: PrismaService,
    sku = `SKU-${randomUUID().slice(0, 8)}`,
) {
    return prisma.product.create({
        data: {
            id: randomUUID(),
            sku,
            name: "Test product",
            category: "test",
            unitCost: "10.00",
            holdingCostRate: "0.2500",
        },
    });
}

export async function createSupplier(prisma: PrismaService) {
    return prisma.supplier.create({
        data: {
            id: randomUUID(),
            name: "Test supplier",
            orderingCost: "50.00",
        },
    });
}
