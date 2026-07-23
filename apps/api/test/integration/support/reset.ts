import type { PrismaService } from "../../../src/shared/prisma/prisma.service.js";

export async function resetDatabase(prisma: PrismaService): Promise<void> {
    await prisma.$executeRawUnsafe(`
        TRUNCATE stock_movements, inventory_items, supplier_products, suppliers, products
        RESTART IDENTITY CASCADE
    `);
}
