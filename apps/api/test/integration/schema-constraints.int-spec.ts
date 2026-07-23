import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaService } from "../../src/shared/prisma/prisma.service.js";
import { resetDatabase } from "./support/reset.js";
import { seedProduct, seedSupplier } from "./support/seed.js";

const prisma = new PrismaService();

describe("schema invariants", () => {
    beforeEach(() => resetDatabase(prisma));
    afterAll(() => prisma.$disconnect());

    // CHECK — reserved <= on_hand
    it("rejects reserved > on_hand", async () => {
        const product = await seedProduct(prisma);
        await expect(
            prisma.$executeRaw`
                INSERT INTO inventory_items (product_id, on_hand, reserved)
                VALUES (${product.id}::uuid, 5, 10)
            `,
        ).rejects.toThrow();
    });

    // TRIGGER — append-only
    it("rejects UPDATE on stock_movements", async () => {
        const product = await seedProduct(prisma);
        const id = randomUUID();
        await prisma.$executeRaw`
            INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
            VALUES (${id}::uuid, ${product.id}::uuid, 'RECEIPT', 10, '2026-07-20', 'MANUAL')
        `;
        await expect(
            prisma.$executeRaw`UPDATE stock_movements SET signed_qty = 999 WHERE id = ${id}::uuid`,
        ).rejects.toThrow();
    });

    it("rejects moq = 0", async () => {
        const product = await seedProduct(prisma);
        const supplier = await seedSupplier(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO supplier_products
          (id, supplier_id, product_id, lead_time_mean_weeks, lead_time_std_weeks, unit_cost, moq, is_primary, active)
        VALUES (${randomUUID()}::uuid, ${supplier.id}::uuid, ${product.id}::uuid, 2.0, 0.5, 9.00, 0, false, true)
    `).rejects.toThrow();
    });

    it("rejects a second primary supplier for the same product", async () => {
        const product = await seedProduct(prisma);
        const s1 = await seedSupplier(prisma);
        const s2 = await seedSupplier(prisma);
        const insertPrimary = (supplierId: string) => prisma.$executeRaw`
        INSERT INTO supplier_products
          (id, supplier_id, product_id, lead_time_mean_weeks, lead_time_std_weeks, unit_cost, moq, is_primary, active)
        VALUES (${randomUUID()}::uuid, ${supplierId}::uuid, ${product.id}::uuid, 2.0, 0.5, 9.00, 1, true, true)
    `;
        await insertPrimary(s1.id);
        await expect(insertPrimary(s2.id)).rejects.toThrow();
    });

    // CHECK signed_qty <> 0 — uso ADJUSTMENT para aislar (RECEIPT además exige > 0)
    it("rejects signed_qty = 0", async () => {
        const p = await seedProduct(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
        VALUES (${randomUUID()}::uuid, ${p.id}::uuid, 'ADJUSTMENT', 0, '2026-07-20', 'MANUAL')
    `).rejects.toThrow();
    });

    // CHECK signo/tipo — RECEIPT debe ser > 0
    it("rejects RECEIPT with negative qty", async () => {
        const p = await seedProduct(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
        VALUES (${randomUUID()}::uuid, ${p.id}::uuid, 'RECEIPT', -5, '2026-07-20', 'MANUAL')
    `).rejects.toThrow();
    });

    // CHECK week es lunes — 2026-07-21 es martes
    it("rejects a non-Monday week", async () => {
        const p = await seedProduct(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
        VALUES (${randomUUID()}::uuid, ${p.id}::uuid, 'RECEIPT', 10, '2026-07-21', 'MANUAL')
    `).rejects.toThrow();
    });

    // TRIGGER — DELETE bloqueado
    it("rejects DELETE on stock_movements", async () => {
        const p = await seedProduct(prisma);
        const id = randomUUID();
        await prisma.$executeRaw`
        INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
        VALUES (${id}::uuid, ${p.id}::uuid, 'RECEIPT', 10, '2026-07-20', 'MANUAL')
    `;
        await expect(
            prisma.$executeRaw`DELETE FROM stock_movements WHERE id = ${id}::uuid`,
        ).rejects.toThrow();
    });

    // POSITIVO — este pasa desde ya (verde)
    it("allows a valid INSERT into stock_movements", async () => {
        const p = await seedProduct(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO stock_movements (id, product_id, type, signed_qty, week, reference_type)
        VALUES (${randomUUID()}::uuid, ${p.id}::uuid, 'RECEIPT', 10, '2026-07-20', 'MANUAL')
    `).resolves.toBe(1);
    });

    // CHECK — holding_cost_rate en [0, 1)
    it("rejects holding_cost_rate = 1", async () => {
        await expect(prisma.$executeRaw`
        INSERT INTO products (id, sku, name, category, unit_cost, holding_cost_rate)
        VALUES (${randomUUID()}::uuid, ${`SKU-${randomUUID().slice(0, 8)}`}, 'Test', 'test', 10.00, 1.0000)
    `).rejects.toThrow();
    });

    it("rejects negative on_hand", async () => {
        const p = await seedProduct(prisma);
        await expect(prisma.$executeRaw`
        INSERT INTO inventory_items (product_id, on_hand) VALUES (${p.id}::uuid, -1)
    `).rejects.toThrow();
    });

    it("rejects an empty sku", async () => {
        await expect(prisma.$executeRaw`
        INSERT INTO products (id, sku, name, category, unit_cost, holding_cost_rate)
        VALUES (${randomUUID()}::uuid, '', 'Test', 'test', 10.00, 0.2500)
    `).rejects.toThrow();
    });

    it("rejects negative unit_cost", async () => {
        await expect(prisma.$executeRaw`
        INSERT INTO products (id, sku, name, category, unit_cost, holding_cost_rate)
        VALUES (${randomUUID()}::uuid, ${`SKU-${randomUUID().slice(0, 8)}`}, 'Test', 'test', -1.00, 0.2500)
    `).rejects.toThrow();
    });
});
