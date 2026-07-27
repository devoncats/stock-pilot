import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import {
    createInventoryItem,
    createProduct,
    createStockMovement,
} from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "@/app.module.js";
import { configureApp } from "@/app.setup.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

describe("Inventory (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = configureApp(moduleRef.createNestApplication());
        await app.init();

        prisma = moduleRef.get(PrismaService);
    });

    beforeEach(async () => await resetDatabase(prisma));

    afterAll(async () => {
        await app?.close();
    });

    it("GET /api/v1/inventory returns the {data,offset,limit,total} envelope", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 5 });

        const response = await request(app.getHttpServer()).get(
            "/api/v1/inventory",
        );

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ offset: 0, limit: 25, total: 1 });
        expect(response.body.data).toHaveLength(1);
    });

    it("GET /api/v1/inventory?limit=101 returns 400", async () => {
        const response = await request(app.getHttpServer()).get(
            "/api/v1/inventory?limit=101",
        );

        expect(response.status).toBe(400);
    });

    it("GET /api/v1/inventory/:id returns 404 for an unknown product", async () => {
        const response = await request(app.getHttpServer()).get(
            "/api/v1/inventory/00000000-0000-7000-8000-000000000000",
        );

        expect(response.status).toBe(404);
    });

    it("GET /api/v1/inventory/:id/movements shows the newest adjustment first", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id);
        await createStockMovement(prisma, product.id, { reason: "older" });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await createStockMovement(prisma, product.id, { reason: "newest" });

        const response = await request(app.getHttpServer()).get(
            `/api/v1/inventory/${product.id}/movements`,
        );

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toMatchObject({ reason: "newest" });
    });

    it("GET /api/v1/kpis returns 200 with all four fields and integer cents", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 3 });

        const response = await request(app.getHttpServer()).get("/api/v1/kpis");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("totalSkus");
        expect(response.body).toHaveProperty("inventoryValueCents");
        expect(response.body).toHaveProperty("averageCoverageWeeks");
        expect(response.body).toHaveProperty("skusOutOfStock");
        expect(Number.isInteger(response.body.inventoryValueCents)).toBe(true);
    });

    it("records an adjustment and returns the updated position", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 50 });

        const response = await request(app.getHttpServer())
            .post("/api/v1/inventory/movements")
            .send({
                productId: product.id,
                qty: -3,
                reason: "damaged in handling",
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            productId: product.id,
            onHand: 47,
            available: 47,
            position: 47,
        });
    });

    it("rejects an adjustment that would leave stock negative, inserting nothing", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 2 });

        const response = await request(app.getHttpServer())
            .post("/api/v1/inventory/movements")
            .send({ productId: product.id, qty: -3, reason: "damaged" });

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({ code: "INSUFFICIENT_STOCK" });
        expect(await prisma.stockMovement.count()).toBe(0);
    });

    it("refuses a movement type other than an adjustment", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 50 });

        const response = await request(app.getHttpServer())
            .post("/api/v1/inventory/movements")
            .send({
                productId: product.id,
                type: "RECEIPT",
                qty: 3,
                reason: "delivery",
            });

        expect(response.status).toBe(400);
    });

    it("returns 404 for a product with no inventory item", async () => {
        const product = await createProduct(prisma);

        const response = await request(app.getHttpServer())
            .post("/api/v1/inventory/movements")
            .send({ productId: product.id, qty: -3, reason: "damaged" });

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            code: "INVENTORY_ITEM_NOT_FOUND",
        });
    });
});
