import { randomUUID } from "node:crypto";
import type { PrismaService } from "@/shared/prisma/prisma.service.js";

// Datos base válidos para satisfacer las FKs de los tests de constraints.
export async function seedProduct(
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

export async function seedSupplier(prisma: PrismaService) {
    return prisma.supplier.create({
        data: {
            id: randomUUID(),
            name: "Test supplier",
            orderingCost: "50.00",
        },
    });
}
