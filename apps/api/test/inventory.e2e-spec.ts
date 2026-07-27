import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import {
    createInventoryItem,
    createProduct,
    createStockMovement,
} from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "@/app.module.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

describe("Inventory (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ transform: true, whitelist: true }),
        );
        await app.init();

        prisma = moduleRef.get(PrismaService);
        await resetDatabase(prisma);
    });

    afterAll(async () => {
        await app.close();
    });

    it("GET /inventory returns the {data,page,limit,total} envelope", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 5 });

        const response = await request(app.getHttpServer()).get("/inventory");

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ page: 1, limit: 25, total: 1 });
        expect(response.body.data).toHaveLength(1);
    });

    it("GET /inventory?limit=101 returns 400", async () => {
        const response = await request(app.getHttpServer()).get(
            "/inventory?limit=101",
        );

        expect(response.status).toBe(400);
    });

    it("GET /inventory/:id returns 404 for an unknown product", async () => {
        const response = await request(app.getHttpServer()).get(
            "/inventory/00000000-0000-7000-8000-000000000000",
        );

        expect(response.status).toBe(404);
    });

    it("GET /inventory/:id/movements shows the newest adjustment first", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id);
        await createStockMovement(prisma, product.id, { reason: "older" });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await createStockMovement(prisma, product.id, { reason: "newest" });

        const response = await request(app.getHttpServer()).get(
            `/inventory/${product.id}/movements`,
        );

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toMatchObject({ reason: "newest" });
    });

    it("GET /kpis returns 200 with all four fields and integer cents", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 3 });

        const response = await request(app.getHttpServer()).get("/kpis");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("totalSkus");
        expect(response.body).toHaveProperty("inventoryValueCents");
        expect(response.body).toHaveProperty("averageCoverageWeeks");
        expect(response.body).toHaveProperty("skusOutOfStock");
        expect(Number.isInteger(response.body.inventoryValueCents)).toBe(true);
    });
});
