import { readFileSync } from "node:fs";
import { uuidv7 } from "uuidv7";
import { createPrng } from "@/seed/prng.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import {
    generateSyntheticSkus,
    type WeeklyDemand,
} from "./synthetic-generator.js";

const SUPPLIER_COUNT = 10;
const WEEKS_OF_COVER = 4;
const SOURCING_SEED_OFFSET = 1_000_000;

export interface SeedOptions {
    path: string;
    count: number;
    seed: number;
    startWeek: string;
    weeks?: number;
}

interface SeedProduct {
    sku: string;
    category: string;
    price: number;
    unitCost: number;
    weeklyDemand: WeeklyDemand[];
}

export interface SeedSummary {
    products: number;
    suppliers: number;
    supplierProducts: number;
    inventoryItems: number;
    stockMovements: number;
    demandWeeks: number;
}

function asDate(week: string): Date {
    const date = new Date(`${week}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`[seed] Invalid week date: ${week}`);
    }

    return date;
}

function generateSupplierId(i: number): string {
    const id = `00000000-0000-7000-8000-${String(i).padStart(12, "0")}`;

    return id;
}

function readWeeklyDemand(path: string): SeedProduct[] {
    const lines = readFileSync(path, "utf-8").trim().split(/\r?\n/).slice(1);
    const bySku = new Map<string, SeedProduct>();

    for (const line of lines) {
        const [sku, week, qty, category, price, unitCost] = line.split(",");

        if (!sku || !week || !qty || !category || !price || !unitCost) {
            throw new Error(
                `[seed] Invalid line in weekly demand CSV: ${line}`,
            );
        }

        let product = bySku.get(sku);

        if (!product) {
            product = {
                sku,
                category,
                price: Number(price),
                unitCost: Number(unitCost),
                weeklyDemand: [],
            };

            bySku.set(sku, product);
        }
        product.weeklyDemand.push({
            week,
            qty: Number(qty),
        });
    }

    return [...bySku.values()];
}

function pickDistinct(
    pool: string[],
    count: number,
    random: () => number,
): string[] {
    const remaining = [...pool];

    const distinct = Array.from({ length: count }, () => {
        return remaining.splice(Math.floor(random() * remaining.length), 1)[0];
    });

    return distinct as string[];
}

async function upsertSupplierPool(prisma: PrismaService): Promise<string[]> {
    const ids = Array.from({ length: SUPPLIER_COUNT }, (_, i) =>
        generateSupplierId(i + 1),
    );

    for (const [index, id] of ids.entries()) {
        await prisma.supplier.upsert({
            where: { id },
            create: {
                id,
                name: `Supplier ${String(index + 1).padStart(2, "0")}`,
                orderingCost: "50.00",
            },
            update: {},
        });
    }

    return ids;
}

async function upsertProduct(
    prisma: PrismaService,
    item: SeedProduct,
): Promise<string> {
    const product = await prisma.product.upsert({
        where: { sku: item.sku },
        create: {
            id: uuidv7(),
            sku: item.sku,
            name: item.sku.replace(/_/g, " "),
            category: item.category,
            unitCost: item.unitCost.toFixed(2),
            price: item.price.toFixed(2),
            holdingCostRate: "0.2500",
        },
        update: {
            category: item.category,
            unitCost: item.unitCost.toFixed(2),
            price: item.price.toFixed(2),
        },
    });

    return product.id;
}

async function upsertSourcing(
    prisma: PrismaService,
    productId: string,
    item: SeedProduct,
    supplierIds: string[],
    seed: number,
): Promise<void> {
    const random = createPrng(seed);

    const chosenSuppliers = pickDistinct(
        supplierIds,
        1 + Math.floor(random() * 3),
        random,
    );

    for (const [index, supplierId] of chosenSuppliers.entries()) {
        const meanWeeks = 1 + random() * 5;

        await prisma.supplierProduct.upsert({
            where: { supplierId_productId: { supplierId, productId } },
            create: {
                id: uuidv7(),
                supplierId,
                productId,
                leadTimeMeanWeeks: meanWeeks.toFixed(2),
                leadTimeStdWeeks: (meanWeeks * 0.2).toFixed(2),
                unitCost: (item.unitCost * (0.9 + random() * 0.2)).toFixed(2),
                moq: 1 + Math.floor(random() * 50),
                isPrimary: index === 0,
            },
            update: {},
        });
    }
}

async function seedInitialStock(
    prisma: PrismaService,
    productId: string,
    item: SeedProduct,
): Promise<void> {
    const movements = await prisma.stockMovement.count({
        where: { productId },
    });

    if (movements > 0) return;

    // The receipt is dated on the SKU's first demand week, so a product with no
    // weeks has nothing to date it with. Fail with a seed error rather than
    // letting `new Date(undefined)` reach Prisma as an Invalid Date.
    const firstWeek = item.weeklyDemand[0]?.week;

    if (!firstWeek) {
        throw new Error(
            `[seed] ${item.sku} has no demand weeks; cannot date its initial stock`,
        );
    }

    const total = item.weeklyDemand.reduce((sum, w) => sum + w.qty, 0);

    const average = total / Math.max(1, item.weeklyDemand.length);

    const qty = Math.max(1, Math.round(average * WEEKS_OF_COVER));

    await prisma.$transaction([
        prisma.stockMovement.create({
            data: {
                id: uuidv7(),
                productId,
                type: "RECEIPT",
                signedQty: qty,
                week: asDate(firstWeek),
                referenceType: "MANUAL",
                reason: "Initial seed stock",
            },
        }),
        prisma.inventoryItem.upsert({
            where: { productId },
            create: { productId, onHand: qty },
            update: { onHand: qty },
        }),
    ]);
}

async function seedDemandHistory(
    prisma: PrismaService,
    productId: string,
    item: SeedProduct,
): Promise<void> {
    await prisma.demandHistory.createMany({
        data: item.weeklyDemand.map((w) => ({
            id: uuidv7(),
            productId,
            week: asDate(w.week),
            qty: w.qty,
        })),
        skipDuplicates: true,
    });
}

async function summarize(prisma: PrismaService): Promise<SeedSummary> {
    const [
        products,
        suppliers,
        supplierProducts,
        inventoryItems,
        stockMovements,
        demandWeeks,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.supplier.count(),
        prisma.supplierProduct.count(),
        prisma.inventoryItem.count(),
        prisma.stockMovement.count(),
        prisma.demandHistory.count(),
    ]);

    return {
        products,
        suppliers,
        supplierProducts,
        inventoryItems,
        stockMovements,
        demandWeeks,
    };
}

export async function runSeed(
    prisma: PrismaService,
    options: SeedOptions,
): Promise<SeedSummary> {
    const m5 = readWeeklyDemand(options.path);

    const synthetic: SeedProduct[] = generateSyntheticSkus({
        seed: options.seed,
        count: options.count,
        weeks: options.weeks ?? 52,
        startWeek: options.startWeek,
    });

    const items = [...m5, ...synthetic];
    const suppliersIds = await upsertSupplierPool(prisma);

    for (const [index, item] of items.entries()) {
        const productId = await upsertProduct(prisma, item);

        await upsertSourcing(
            prisma,
            productId,
            item,
            suppliersIds,
            options.seed + SOURCING_SEED_OFFSET + index,
        );

        await seedInitialStock(prisma, productId, item);
        await seedDemandHistory(prisma, productId, item);
    }

    return await summarize(prisma);
}
