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

export async function createInventoryItem(
    prisma: PrismaService,
    productId: string,
    overrides: {
        onHand?: number;
        reserved?: number;
        onOrder?: number;
        backordered?: number;
    } = {},
) {
    return prisma.inventoryItem.create({
        data: {
            productId,
            onHand: overrides.onHand ?? 0,
            reserved: overrides.reserved ?? 0,
            onOrder: overrides.onOrder ?? 0,
            backordered: overrides.backordered ?? 0,
        },
    });
}

export async function createDemandHistory(
    prisma: PrismaService,
    productId: string,
    weeks: Array<{ week: string; qty: number }>,
) {
    return prisma.demandHistory.createMany({
        data: weeks.map(({ week, qty }) => ({
            id: randomUUID(),
            productId,
            week: new Date(`${week}T00:00:00Z`),
            qty,
        })),
    });
}

export async function createStockMovement(
    prisma: PrismaService,
    productId: string,
    overrides: {
        type?: "RECEIPT" | "SHIPMENT" | "ADJUSTMENT";
        signedQty?: number;
        week?: string;
        referenceType?: "PURCHASE_ORDER" | "CUSTOMER_ORDER" | "MANUAL";
        reason?: string | null;
    } = {},
) {
    return prisma.stockMovement.create({
        data: {
            id: randomUUID(),
            productId,
            type: overrides.type ?? "ADJUSTMENT",
            signedQty: overrides.signedQty ?? 1,
            week: new Date(`${overrides.week ?? "2026-01-05"}T00:00:00Z`),
            referenceType: overrides.referenceType ?? "MANUAL",
            reason: overrides.reason ?? null,
        },
    });
}
